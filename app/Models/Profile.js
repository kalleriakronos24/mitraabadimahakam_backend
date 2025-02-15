'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Profile extends Model {
    user () {
        return this.belongsTo("App/Models/User", "user_id", "id")
    }

    employee () {
        return this.belongsTo("App/Models/MasEmployee", "employee_id", "id")
    }
}

module.exports = Profile
