'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MasEmployeeSchema extends Schema {
  up () {
    this.create('mas_employees', (table) => {
      table.increments()
      table.string('nik', 25).notNullable().unique()
      table.string('old_nik', 25).notNullable()
      table.date('awal_kontrak').defaultTo(null)
      table.date('akhir_kontrak').defaultTo(null)
      table.string('fullname').notNullable()
      table.text('alamat').defaultTo(null)
      table.enu('sex', ['m', 'f']).defaultTo('m')
      table.string('t4_lahir', 50).defaultTo(null)
      table.date('tgl_lahir').defaultTo(null)
      table.string('agama').defaultTo(null)
      table.enu('tipe_idcard', ['KTP', 'SIM', 'PASSPORT']).defaultTo('SIM')
      table.string('no_idcard', 30).defaultTo(null)
      table.string('warganegara').defaultTo(null)
      table.integer('tinggi_bdn').defaultTo(null)
      table.integer('berat_bdn').defaultTo(null)
      table.string('sts_kawin').defaultTo(null)
      table.string('tipe_employee', 50).defaultTo(null).comment('status penerimaan HO atau SITE')
      table.string('sts_employee', 30).defaultTo(null)
      table.enu('is_operator', ['Y', 'N']).defaultTo('N')
      table.date('join_date').defaultTo(null)
      table.string('phone', 25).defaultTo(null)
      table.string('email', 100).defaultTo(null)
      table.integer('created_by').unsigned().references('id').inTable('users').onDelete('CASCADE').onUpdate('CASCADE')
      table.enu('aktif', ['Y', 'N']).defaultTo('Y')
      table.timestamps()
    })
  }

  down () {
    this.drop('mas_employees')
  }
}

module.exports = MasEmployeeSchema
