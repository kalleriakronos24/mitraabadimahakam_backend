'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MamFuelDistSchema extends Schema {
  up () {
    this.create('mam_fuel_dists', (table) => {
      table.increments()
      table.integer('site_id').unsigned().references('id').inTable('mas_sites').onDelete('CASCADE').onUpdate('CASCADE')
      table.integer('agen_id').unsigned().references('id').inTable('mas_fuel_agens').onDelete('CASCADE').onUpdate('CASCADE')
      table.integer('fuel_id').unsigned().references('id').inTable('mas_fuels').onDelete('CASCADE').onUpdate('CASCADE')
      table.string('no_do').notNullable()
      table.date('tgl_do').notNullable()
      table.string('no_so').notNullable()
      table.integer('flow_meter').notNullable()
      table.string('no_plat', 12).notNullable()
      table.float('sg_meter', 8, 3).defaultTo(null)
      table.string('seal_top').notNullable()
      table.string('seal_bott1').notNullable()
      table.string('seal_bott2').defaultTo(null)
      table.string('temp').defaultTo(null)
      table.datetime('departure').defaultTo(null)
      table.datetime('arrival').defaultTo(null)
      table.string('mengetahui').notNullable()
      table.string('recipient').notNullable()
      table.string('truck_driver').defaultTo(null)
      table.timestamps()
    })
  }

  down () {
    this.drop('mam_fuel_dists')
  }
}

module.exports = MamFuelDistSchema
