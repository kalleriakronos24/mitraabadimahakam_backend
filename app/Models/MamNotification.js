'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class MamNotification extends Model {
    user () {
        return this.belongsTo("App/Models/User", "user_id", "id")
    }
}

module.exports = MamNotification
