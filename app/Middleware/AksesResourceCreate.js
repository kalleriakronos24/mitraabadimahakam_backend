'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const v_Akses = use("App/Models/VPrivilege")


class AksesResourceCreate {

  async handle ({ request, response, auth }, next) {
    const uri = (request.url()).split('/')
    const usr = await auth.getUser()
    const name = uri[2]
    console.log(usr.user_tipe);
    if(usr.user_tipe == 'administrator'){
      await next()
    }else{
      const akses = await v_Akses.query().where({usertipe: usr.user_tipe, nm_module: name, method: 'C'}).first()
      if(akses){
        console.log('HAK AKSES DITEMUKAN');
        await next()
      }else{
        console.log('HAK AKSES TIDAK DITEMUKAN');
        response.status(404).json({
          success: false, 
          usertype: usr.user_tipe,
          message: 'You not authorized....'
        })
      }
    }

    
  }
}

module.exports = AksesResourceCreate
