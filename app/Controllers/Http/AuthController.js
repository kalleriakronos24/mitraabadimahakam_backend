'use strict'

const Env = use('Env')
const Hash = use('Hash')
const Helpers = use('Helpers')
const moment = require("moment")
const User = use("App/Models/User")
const Token = use("App/Models/Token")
const nodemailer = require('nodemailer')
const Profile = use("App/Models/Profile")
const SysError = use("App/Models/SysError")

const transporter = nodemailer.createTransport({
    host: Env.get('SMTP_HOST'),
    port: Env.get('SMTP_PORT'),
    auth: {
        user: Env.get('MAIL_USERNAME'),
        pass: Env.get('MAIL_PASSWORD')
    },
});

class AuthController {
    async index ({view, auth, response}) {
        try {
            await auth.check()
            return response.redirect('/')
        } catch (error) {
            console.log('error ', error);
            return response.route('login')
        }
    }

    async show ({view, auth, response}) {
        try {
            await auth.check()
            return response.redirect('back')
        } catch (error) {
            return view.render('login')
        }
    }

    async login ({ request, auth, response, session, view }) {
        const { username, password } = request.all()

        try {
            await auth.remember(true).attempt(username, password)
            const usr = await auth.getUser()
            if(usr.status != 'Y'){
                await auth.logout()
                session.flash({loginError: 'User Status Inactive...'})
                return response.redirect('/login')
            }
            else{
                const token = await Token.query().where('user_id', usr.id).last()
                var uri = request.headers().origin + '/' + token.token + '/logout'
                transporter.sendMail({
                    from: '"Administrator Alert '+moment().format('YYMMDD HH:mm')+' " <ayat.ekapoetra@gmail.com>', // sender address
                    to: `${usr.email}`, // list of receivers
                    subject: "MAM SYSTEM Notification ✔", // Subject line
                    text: "There is a new article. It's about sending emails, check it out!", // plain text body
                    html: view.render("email-login-notification", {
                        date: moment().format('dddd, DD MMMM YYYY'),
                        time: moment().format('HH:mm A') + ' WIB',
                        user: request.headers()['user-agent'],
                        uri: uri
                    }),
                }).then(info => {
                  console.log({info});
                }).catch(console.error);
                return response.redirect('/')
            }
        } catch (error) {
            console.log('error.code ', error)
            const syserror = new SysError()
            syserror.fill({name: error.code || 'E_LOGIN', message: error.sqlMessage, description: 'E_INVALID_SESSION', error_by: null})
            await syserror.save()
            session.flash({loginError: 'Authorization Failed...'})
            return response.redirect('/login')
        }
    }

    async profile ({auth, params, view}) {
        let usr
        try {
            usr = await auth.getUser()
        } catch (error) {
            console.log('error:::', error.name);
        }
        let profile
        if(usr.user_tipe != 'administrator'){
            profile = (await Profile.query().with('user').with('employee').where('user_id', usr.id).last()).toJSON()
        }else{
            profile = (await Profile.query().with('user').with('employee').where('user_id', params.id).last()).toJSON()
        }
        // console.log(profile);
        return view.render('profile', {user: profile})
    }

    async updatePassword ({auth, request, response}) {
        const req = JSON.parse(request.raw())
        const usr = await auth.getUser()
        const isIdentik = await Hash.verify(req.oldpass, usr.password)
        if(isIdentik){
            const user = await User.find(usr.id)
            user.merge({password: req.newpass})
            await user.save()
            await Token.query().where('user_id', usr.id).delete()
            await auth.logout()
            return response.status(200).json({
                success: true,
                message: 'Success update password, Reload halaman dan login dengan password baru anda...',
                red_uri: '/login'
            })
        }else{
            return response.status(403).json({
                success: false,
                message: 'Password lama tidak sesuai...'
            })
        }
    }

    async updateAvatar ( { auth, params, request } ) {
        const validateFile = {
            types: ['jpg', 'jpeg', 'png'],
            size: '2mb',
            types: ['image']
        }
        
        const avatar = request.file("avatar", validateFile)
        if (avatar) {
            let aliasName = `AVATAR-${params.id}-${moment().format(
                 'DDMMYY'
            )}.${avatar.extname}`

            await avatar.move(Helpers.publicPath(`/avatar/`), {
                 name: aliasName,
                 overwrite: true,
            })

            if (!avatar.moved()) {
                 return avatar.error()
            }
            const profil = await Profile.query().where('user_id', params.id).last()
            profil.merge({avatar: 'avatar/'+aliasName})
            await profil.save()
            return {
                success: true,
                red_uri: '/profile/'+params.id,
                message: 'Avatar update success, please reload page to take effect...'
            }
       } else {
            return {
                 title: ['No File Upload'],
                 data: [],
            }
       }
    }

    async loggingOut ({auth, params, response}) {
        const usr = await auth.getUser()
        if(params.token){
            const logoutUsr = await Token.query().where('token', params.token).last()
            logoutUsr.merge({is_revoked: 1})
            await logoutUsr.save()
        }else{
            
        }
        await Token.query().where('user_id', usr.id).delete()
        await auth.logout()
        return response.redirect('/login')
    }

    async loggingOutToken ({auth, params, response}) {
        if(params.token){
            try {
                const logoutUsr = await Token.query().where('token', params.token).last()
                await logoutUsr.delete()
                await auth.logout()
                return response.redirect('/login')
            } catch (error) {
                return response.redirect('/404')
            }
        }
    }
}

module.exports = AuthController
