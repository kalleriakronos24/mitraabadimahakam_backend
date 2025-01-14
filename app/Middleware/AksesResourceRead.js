'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const v_Akses = use("App/Models/VPrivilege")

class AksesResourceRead {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request, response, auth }, next) {

    // call next to advance the request
    const uri = (request.url()).split('/')
    
    const usr = await auth.getUser()
    const name = uri[2]
    if(usr.user_tipe === 'administrator'){
      console.log('middleware:: ', uri);
      await next()
    }
    console.log('USER-TIPE :::', usr.user_tipe);
    console.log('NM-MODULE :::', name);
    const akses = await v_Akses.query().where({usertipe: usr.user_tipe, nm_module: name, method: 'R'}).first()
    // console.log('AKSES >>>>>', akses);
    if(akses){
      console.log('HAK AKSES DITEMUKAN');
      await next()
    }else{
      console.log('HAK AKSES TIDAK DITEMUKAN');
      console.log('middleware:: ', uri);
      response.status(404).json({success: false, message: 'You not authorized....'})
    }
  }
}

module.exports = AksesResourceRead
