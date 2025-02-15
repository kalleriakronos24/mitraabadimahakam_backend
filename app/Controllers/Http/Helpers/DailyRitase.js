'use strict'

const DailyFleet = use('App/Models/DailyFleet')
const DailyRitase = use('App/Models/DailyRitase')
const DailyRitaseDetail = use('App/Models/DailyRitaseDetail')
const MonthlyPlans = use('App/Models/MonthlyPlan')
const DailyPlans = use('App/Models/DailyPlan')
const moment = require('moment')
const excelToJson = require('convert-excel-to-json')
const fs = require('fs')
const _ = require('underscore')
const MasShift = use('App/Models/MasShift')
const MasPit = use('App/Models/MasPit')
const MasFleet = use('App/Models/MasFleet')
const MasEquipment = use('App/Models/MasEquipment')
const DailyFleetEquipment = use('App/Models/DailyFleetEquip')
const MasMaterial = use('App/Models/MasMaterial')
const Helpers = use('Helpers')
const diagnoticTime = use('App/Controllers/Http/customClass/diagnoticTime')

class Ritase {
  async ALL(req) {
    const limit = parseInt(req.limit)
    const halaman = req.page === undefined ? 1 : parseInt(req.page)
    let dailyRitase
    let arrFilter
    if (req.keyword) {
      const fleet = await DailyFleet.query()
        .where(w => {
          if (req.fleet_id) {
            w.where('fleet_id', req.fleet_id)
          }

          if (req.shift_id) {
            w.where('shift_id', req.shift_id)
          }
        })
        .fetch()

      if (fleet) {
        arrFilter = fleet.toJSON().map(item => item.id)
      }

      console.log('REQ HELPERS :::', req)

      dailyRitase = await DailyRitase.query()
        .with('material_details')
        .with('ritase_details', item => {
          item.with('checker', b => b.with('profile'))
          item.with('spv', b => b.with('profile'))
          item.with('hauler')
        })
        .with('daily_fleet', details => {
          details.with('details', unit => unit.with('equipment'))
          details.with('shift')
          details.with('activities')
          details.with('fleet')
          details.with('pit')
        })
        .where(whe => {
          if (req.distance) {
            whe.where('distance', req.distance)
          }

          if (req.material) {
            whe.where('material', req.material)
          }

          if (req.exca_id) {
            whe.where('exca_id', req.exca_id)
          }

          if (arrFilter.length > 0) {
            whe.where('status', 'Y')
            if (req.begin_date) {
              whe.where('date', '>=', req.begin_date)
              whe.where('date', '<=', req.end_date)
            }
            whe.whereIn('dailyfleet_id', arrFilter)
          } else {
            if (req.begin_date) {
              whe.where('date', '>=', req.begin_date)
              whe.where('date', '<=', req.end_date)
            }
            whe.where('status', 'Y')
          }
        })
        .orderBy('date', 'desc')
        .paginate(halaman, limit)
    } else {
      dailyRitase = await DailyRitase.query()
        .with('material_details')
        .with('ritase_details', item => {
          item.with('checker', b => b.with('profile'))
          item.with('spv', b => b.with('profile'))
          item.with('hauler')
          item.orderBy('created_at', 'desc')
        })
        .with('daily_fleet', details => {
          details.with('details', unit => unit.with('equipment'))
          details.with('shift')
          details.with('activities')
          details.with('fleet')
          details.with('pit')
        })
        .where('status', 'Y')
        .orderBy('date', 'desc')
        .paginate(halaman, limit)
    }
    return dailyRitase
  }

  async DETAILS (params) {
    let data = (
      await DailyRitaseDetail
      .query()
      .with('operator')
      .with('checker', p => p.with('profile'))
      .with('hauler')
      .where('dailyritase_id', params.id)
      .fetch()
    ).toJSON()
    data = data.map( el => {
      return {
        ...el,
        check_in: moment(el.check_in).format('DD-MM-YYYY')
      }
    })
    return data
  }

  async BY_PIT(params, req) {
    const limit = 25
    const halaman = req.page === undefined ? 1 : parseInt(req.page)
    const dailyRitaseDetail = await DailyRitaseDetail.query()
      .with('daily_ritase', a => {
        a.with('daily_fleet', b => {
          b.with('pit')
          b.with('fleet')
          b.with('shift')
          b.where('pit_id', params.pit_id)
        })
        a.with('material_details')
      })
      .with('checker', b => b.with('profile'))
      .with('hauler')
      .orderBy('check_in', 'desc')
      .paginate(halaman, limit)
    return dailyRitaseDetail
  }

  async BY_FLEET(params, req) {
    const limit = 25
    const halaman = req.page === undefined ? 1 : parseInt(req.page)
    const dailyRitaseDetail = await DailyRitaseDetail.query()
      .with('daily_ritase', a => {
        a.with('daily_fleet', b => {
          b.with('pit')
          b.with('fleet')
          b.with('shift')
          b.where('fleet_id', params.fleet_id)
        })
        a.with('material_details')
      })
      .with('checker', b => b.with('profile'))
      .with('hauler')
      .orderBy('check_in', 'desc')
      .paginate(halaman, limit)
    return dailyRitaseDetail
  }

  async BY_SHIFT(params, req) {
    const limit = 25
    const halaman = req.page === undefined ? 1 : parseInt(req.page)
    const dailyRitaseDetail = await DailyRitaseDetail.query()
      .with('daily_ritase', a => {
        a.with('daily_fleet', b => {
          b.with('pit')
          b.with('fleet')
          b.with('shift')
          b.where('shift_id', params.shift_id)
        })
        a.with('material_details')
      })
      .with('checker', b => b.with('profile'))
      .with('hauler')
      .orderBy('check_in', 'desc')
      .paginate(halaman, limit)
    return dailyRitaseDetail
  }

  async BY_RIT_ID(req) {
    const limit = 25
    const halaman = req.page === undefined ? 1 : parseInt(req.page)
    const dailyRitaseDetail = await DailyRitaseDetail.query()
      .with('daily_ritase', wh => wh.where('id', req.id))
      .with('checker', b => b.with('profile'))
      .with('spv', b => b.with('profile'))
      .orderBy('check_in', 'desc')
      .paginate(halaman, limit)
    return dailyRitaseDetail
  }

  async ID_SHOW(params) {
    const dailyRitase = await DailyRitase.query()
      .with('material_details')
      .with('ritase_details', item => {
        item.with('checker', b => b.with('profile'))
        item.with('spv', b => b.with('profile'))
        item.with('hauler')
      })
      .with('daily_fleet', details => {
        details.with('details', unit => unit.with('equipment'))
        details.with('shift')
        details.with('activities')
        details.with('fleet')
        details.with('pit')
      })
      .where('id', params.id)
      .first()
    return dailyRitase
  }

  async RITASE_BY_DAILY_ID(req) {
    const dailyRitaseDetail = await DailyRitaseDetail.query()
      .with('daily_ritase')
      .with('hauler')
      .with('checker', b => b.with('profile'))
      .with('spv', b => b.with('profile'))
      .where('dailyritase_id', req.id)
      .orderBy([
        { column: 'hauler_id', order: 'desc' },
        { column: 'check_in', order: 'desc' },
      ])
      .fetch()
    return dailyRitaseDetail
  }

  async POST_RITASE_OB(params, req) {
    const dailyRitase = await DailyRitase.find(params.id)
    try {
      dailyRitase.merge(req)
      await dailyRitase.save()
      return dailyRitase
    } catch (error) {
      return null
    }
  }

  async GET_HOURLY_PRODUCTION_OB(id, time) {
    let acc = 0
    const dailyRitaseDetails = await DailyRitaseDetail.query()
      .with('daily_ritase', wh => {
        wh.with('material_details')
      })
      .where('dailyritase_id', id)
      .andWhere('check_in', '>=', time.data.start)
      .andWhere('check_in', '<=', time.data.end)
      .fetch()

    const totalValueOB = dailyRitaseDetails.toJSON().reduce(
      (a, b) => a + b.daily_ritase.material_details.vol,

      0
    )
    acc = {
      val: totalValueOB,
      totalRitase: dailyRitaseDetails.toJSON().length,
    }

    return acc
  }

  async GET_HOURLY_TARGET_BCM(pit_id, date) {
    const SoM = moment(date).startOf('month').format('YYYY-MM-DD HH:mm:ss')

    const monthlyPlansOB = await MonthlyPlans.query().where('pit_id', pit_id).andWhere('month', SoM).andWhere('tipe', 'OB').first()

    const dailyPlans = await DailyPlans.query().where('current_date', date).andWhere('monthlyplans_id', monthlyPlansOB.id).first()

    /**
     * the number 22 is 24 hour subtract by 2 hour (rest time 1 hour for both shift)
     */
    const hourlyTarget = parseInt((parseInt(dailyPlans.estimate) / 22).toFixed(2))
    return hourlyTarget
  }

  async GET_HOURLY_EXCEL_DATA(filePath, req, usr) {
    const xlsx = excelToJson({
      sourceFile: filePath,
      header: 1,
    })

    const sampleSheet = req.sheet || '07-08'
    // this is section where it is not a rotation data
    const getCoalRehandleIndex = xlsx[sampleSheet].findIndex(v => v.V === 'COAL REHANDLE')

    const startIndexRotation = 210
    const spliced = xlsx[sampleSheet].splice(startIndexRotation, getCoalRehandleIndex)

    const shifts = (await MasShift.query().fetch()).toJSON()
    const currentTime = moment().format('YYYY-MM-DD HH:mm:ss')

    let result = []

    for (let shift of shifts) {
      const startShift = moment(`${req.date} ${shift.start_shift}`).format('YYYY-MM-DD HH:mm:ss')
      const endShift = moment(`${req.date} ${shift.start_shift}`).add(shift.duration, 'hour').subtract(1, 'minute').format('YYYY-MM-DD HH:mm:ss')

      if (new Date(currentTime) >= new Date(startShift) && new Date(currentTime) <= new Date(endShift)) {
        const currentShift = shift.kode

        let data = []
        for (let x of spliced) {
          try {
            if (currentShift === 'DS') {
              const obj = {
                excaName: x.V,
                hauler: x.W,
                bm: x.X || 0,
                ob: x.Y || 0,
                soil: x.Z || 0,
                mud: x.AA || 0,
                coal: x.AB || 0,
                pit: x.BF,
                distance: x.BG,
                totalMaterial: x.BH,
              }
              data.push(obj)
            } else {
              const obj = {
                excaName: x.AC,
                hauler: x.AD,
                bm: x.AE || 0,
                ob: x.AF || 0,
                soil: x.AG || 0,
                mud: x.AH || 0,
                coal: x.AI || 0,
                pit: x.BI,
                distance: x.BJ,
                totalMaterial: x.BK,
              }

              data.push(obj)
            }
          } catch (err) {
            throw new Error(err)
          }
        }

        var date = moment(req.date).format('YYYY-MM-DD')

        const __data__ = data.filter(v => v.excaName && v.hauler && v.excaName !== 'COAL REHANDLE')

        const excaNames = _.uniq(__data__.map(v => v.excaName))

        const haulers = []

        for (const exca of excaNames) {
          const obj = {
            excaName: exca,
            haulers: __data__.filter(x => x.excaName === exca),
          }

          haulers.push(obj)
        }


        for (const item of haulers) {
          const excaNameFromExcel = (await MasEquipment.query().where('kode', item.excaName).first()).toJSON()

          if (req.exca_id === String(excaNameFromExcel.id)) {
            // OB MATERIAL / MASTER OB / GLOBAL OB MATERIAL
            try {
              const dailyRitaseCheck = await DailyRitase.query()
                .where(wh => {
                  wh.where('dailyfleet_id', req.dailyfleet_id)
                  wh.andWhere('exca_id', req.exca_id)
                  wh.andWhere('material', 12)
                  wh.andWhere('distance', req.distance)
                  wh.andWhere('date', req.date)
                })
                .last()

                // wh.where('date', reqx.date)
                // wh.andWhere('exca_id', excaID)
                // wh.andWhere('distance', reqx.distance)
                // wh.andWhere('material', reqx.material)
                // wh.andWhere('dailyfleet_id', reqx.dailyfleet_id)

              let dailyRitase = null
              if (dailyRitaseCheck) {
                dailyRitase = dailyRitaseCheck
              } else {
                dailyRitase = new DailyRitase()
                dailyRitase.fill({
                  dailyfleet_id: req.dailyfleet_id,
                  exca_id: req.exca_id,
                  material: 12,
                  distance: req.distance,
                  date: req.date  
                })

                await dailyRitase.save()
              }

              for (const value of item.haulers) {
                const haulerId = (await MasEquipment.query().where('kode', value.hauler).first()).toJSON()

                for (let index = 0; index < value.totalMaterial; index++) {
                  var clock = moment(`${req.date} ${sampleSheet.split('-')[0]}`).format('HH:mm:ss')
                  const ritaseDetail = new DailyRitaseDetail()
                  ritaseDetail.fill({
                    dailyritase_id: dailyRitase.id,
                    checker_id: req.checker_id,
                    spv_id: req.spv_id,
                    hauler_id: haulerId.id,
                    opr_id: null,
                    check_in: date + ' ' + clock,
                  })
                  await ritaseDetail.save()
                }
              }

              let _result = (
                await DailyRitaseDetail.query()
                  .with('daily_ritase', wh => {
                    wh.with('material_details')
                  })
                  .with('checker', wh => {
                    wh.with('profile')
                  })
                  .with('spv', wh => {
                    wh.with('profile')
                  })
                  .where('dailyritase_id', dailyRitase.id)
                  .fetch()
              ).toJSON()

              result.push(_result)
            } catch (err) {
              throw new Error('Error OB >> ', err)
            }
          }
        }

        return result
      }
    }
  }

  async GET_HOURLY_EXCEL_DATA_v2(filePath, req, usr) {
    const xlsx = excelToJson({
      sourceFile: filePath,
      header: 1,
    })
    const sampleSheet = req.sheet || '07-08'
    // this is section where it is not a rotation data
    const getCoalRehandleIndex = xlsx[sampleSheet].findIndex(v => v.V === 'COAL REHANDLE')

    const startIndexRotation = 210
    const spliced = xlsx[sampleSheet].splice(startIndexRotation, getCoalRehandleIndex)

    const shifts = (await MasShift.query().fetch()).toJSON()
    const currentTime = moment().format('YYYY-MM-DD HH:mm:ss')

    for (let shift of shifts) {
      const startShift = moment(`${req.date} ${shift.start_shift}`).format('YYYY-MM-DD HH:mm:ss')
      const endShift = moment(`${req.date} ${shift.start_shift}`).add(shift.duration, 'hour').subtract(1, 'minute').format('YYYY-MM-DD HH:mm:ss')

      if (new Date(currentTime) >= new Date(startShift) && new Date(currentTime) <= new Date(endShift)) {
        const currentShift = shift.kode

        let data = []
        for (let x of spliced) {
          try {
            if (currentShift === 'DS') {
              const obj = {
                excaName: x.V,
                hauler: x.W,
                bm: x.X || 0,
                ob: x.Y || 0,
                soil: x.Z || 0,
                mud: x.AA || 0,
                coal: x.AB || 0,
                pit: x.BE,
                distance: x.BF,
              }
              data.push(obj)
            } else {
              const obj = {
                excaName: x.AC,
                hauler: x.AD,
                bm: x.AE || 0,
                ob: x.AF || 0,
                soil: x.AG || 0,
                mud: x.AH || 0,
                coal: x.AI || 0,
                pit: x.BG,
                distance: x.BH,
              }
              data.push(obj)
            }
          } catch (err) {
            throw new Error(err)
          }
        }

        try {
          const pits = (await MasPit.query().where('sts', 'Y').fetch()).toJSON()

          // local methods
          const GET_DATA_BY_PIT_NAME = pitName => {
            let cleanData = data.filter(v => v.excaName && v.hauler && v.excaName !== 'COAL REHANDLE')

            const result = []
            for (const data of cleanData) {
              if (data.pit === pitName) {
                result.push(data)
              }
            }
            return result
          }

          const GET_FLEET_ID_BY_PIT_ID = async (id, index) => {
            const fleets = (await MasFleet.query().where('pit_id', id).andWhere('tipe', 'OB').andWhere('status', 'Y').fetch()).toJSON()

            const data = []
            for (const fleet of fleets) {
              data.push(fleet)
            }

            return data[index]
          }
          // end of local methods

          const arrPit = []
          for (const pit of pits) {
            const dailyFleets = (await DailyFleet.query().where('date', req.date).andWhere('shift_id', shift.id).andWhere('pit_id', pit.id).fetch()).toJSON()
            const obj = {
              pitName: pit.name,
              pit_id: pit.id,
              data: GET_DATA_BY_PIT_NAME(pit.name),
              dailyFleet: dailyFleets,
            }
            arrPit.push(obj)
          }

          for (const data of arrPit) {
            if (data.data.length > 0 && data.dailyFleet.length > 0) {
              // do somethin
            } else {
              const excas = []
              // if not found let's create the daily fleet
              for (let exca of data.data) {
                excas.push(exca.excaName)
              }

              const uniqExca = _.uniq(excas)
              let idx = 0

              for (const exca of uniqExca) {
                const haulers = [exca, ...data.data.filter(v => v.excaName === exca).map(v => v.hauler)]
                idx += 1
                const df = new DailyFleet()

                df.fill({
                  pit_id: data.pit_id,
                  fleet_id: (await GET_FLEET_ID_BY_PIT_ID(data.pit_id, idx - 1)).id,
                  activity_id: 11, // loading ob
                  shift_id: shift.id,
                  tipe: 'MF', // main fleet
                  user_id: usr.id,
                  date: new Date(req.date),
                })

                await df.save()

                for (let equipment of haulers) {
                  const equipData = await MasEquipment.query().where('kode', equipment).first()

                  const dailyFleetEquip = new DailyFleetEquipment()

                  dailyFleetEquip.fill({
                    dailyfleet_id: df.id,
                    equip_id: equipData.id,
                    datetime: currentTime,
                  })

                  dailyFleetEquip.save()
                }

                const excaID = await MasEquipment.query().where('kode', exca).first()
                const rotationData = Object.values(data.data[0])
                // [ 'ME031', 'OHT043', 0, 2, 0, 0, 0, 'RPU', 1100 ]
                const blasting = rotationData[2]
                const ob = rotationData[3]
                const soil = rotationData[4]
                const mud = rotationData[5]
                const coal = rotationData[6]
                const distance = rotationData[8]

                if (blasting) {
                  const dailyRitase = new DailyRitase()
                  const materialName = await MasMaterial.query().where('name', 'Blasting').first()
                  dailyRitase.fill({
                    dailyfleet_id: df.id,
                    exca_id: excaID.id,
                    material: materialName.id,
                    distance: distance,
                    date: req.date,
                  })

                  await dailyRitase.save()
                }

                if (ob) {
                  const dailyRitase = new DailyRitase()
                  const materialName = await MasMaterial.query().where('name', 'OB').first()
                  dailyRitase.fill({
                    dailyfleet_id: df.id,
                    exca_id: excaID.id,
                    material: materialName.id,
                    distance: distance,
                    date: req.date,
                  })

                  await dailyRitase.save()
                }

                if (soil) {
                  const dailyRitase = new DailyRitase()
                  const materialName = await MasMaterial.query().where('name', 'Soil').first()
                  dailyRitase.fill({
                    dailyfleet_id: df.id,
                    exca_id: excaID.id,
                    material: materialName.id,
                    distance: distance,
                    date: req.date,
                  })

                  await dailyRitase.save()
                }

                if (mud) {
                  const dailyRitase = new DailyRitase()
                  const materialName = await MasMaterial.query().where('name', 'Lumpur').first()
                  dailyRitase.fill({
                    dailyfleet_id: df.id,
                    exca_id: excaID.id,
                    material: materialName.id,
                    distance: distance,
                    date: req.date,
                  })

                  await dailyRitase.save()
                }

                if (coal) {
                  const dailyRitase = new DailyRitase()
                  const materialName = await MasMaterial.query().where('name', COAL).first()
                  dailyRitase.fill({
                    dailyfleet_id: df.id,
                    exca_id: excaID.id,
                    material: materialName.id,
                    distance: distance,
                    date: req.date,
                  })

                  await dailyRitase.save()

                  const drDetail = new DailyRitaseDetail()
                }
              }
            }
          }

          const dailyRitase = new DailyRitase()
          dailyRitase.fill({
            dailyfleet_id: req.dailyfleet_id,
            exca_id: req.exca_id,
            material: req.material,
            distance: req.distance,
            date: req.date,
          })

          await dailyRitase.save()

          var date = moment(req.date).format('YYYY-MM-DD')
          for (const item of data) {
            var clock = moment(item.E).format('HH:mm')
            const ritaseDetail = new DailyRitaseDetail()
            ritaseDetail.fill({
              dailyritase_id: dailyRitase.id,
              checker_id: req.checker_id,
              spv_id: req.spv_id,
              hauler_id: item.A,
              opr_id: item.D != '#N/A' ? item.D : null,
              check_in: date + ' ' + clock,
            })
            await ritaseDetail.save()
          }

          let result = (
            await DailyRitaseDetail.query()
              .with('daily_ritase', wh => {
                wh.with('material_details')
              })
              .with('checker', wh => {
                wh.with('profile')
              })
              .with('spv', wh => {
                wh.with('profile')
              })
              .where('dailyritase_id', dailyRitase.id)
              .fetch()
          ).toJSON()

          return result
        } catch (err) {
          throw new Error(err)
        }
      }
    }
  }

  async GET_HOURLY_EXCEL_DATA_v3(filePath, req, usr) {
    const xlsx = excelToJson({
      sourceFile: filePath,
      header: 1,
    })
    const sampleSheet = req.sheet || '07-08'
    // this is section where it is not a rotation data
    const getCoalRehandleIndex = xlsx[sampleSheet].findIndex(v => v.V === 'COAL REHANDLE')

    const startIndexRotation = 210
    const spliced = xlsx[sampleSheet].splice(startIndexRotation, getCoalRehandleIndex)

    const shifts = (await MasShift.query().fetch()).toJSON()
    const currentTime = moment().format('YYYY-MM-DD HH:mm:ss')

    let result = []

    for (let shift of shifts) {
      const startShift = moment(`${req.date} ${shift.start_shift}`).format('YYYY-MM-DD HH:mm:ss')
      const endShift = moment(`${req.date} ${shift.start_shift}`).add(shift.duration, 'hour').subtract(1, 'minute').format('YYYY-MM-DD HH:mm:ss')

      if (new Date(currentTime) >= new Date(startShift) && new Date(currentTime) <= new Date(endShift)) {
        const currentShift = shift.kode

        let data = []
        for (let x of spliced) {
          try {
            if (currentShift === 'DS') {
              const obj = {
                excaName: x.V,
                hauler: x.W,
                bm: x.X || 0,
                ob: x.Y || 0,
                soil: x.Z || 0,
                mud: x.AA || 0,
                coal: x.AB || 0,
                pit: x.BE,
                distance: x.BF,
              }
              data.push(obj)
            } else {
              const obj = {
                excaName: x.AC,
                hauler: x.AD,
                bm: x.AE || 0,
                ob: x.AF || 0,
                soil: x.AG || 0,
                mud: x.AH || 0,
                coal: x.AI || 0,
                pit: x.BG,
                distance: x.BH,
              }

              data.push(obj)
            }
          } catch (err) {
            throw new Error(err)
          }
        }

        var date = moment(req.date).format('YYYY-MM-DD')

        const __data__ = data.filter(v => v.excaName && v.excaName !== 'COAL REHANDLE')

        const excaNames = _.uniq(__data__.map(v => v.excaName))

        const haulers = []

        for (const exca of excaNames) {
          const obj = {
            excaName: exca,
            haulers: __data__.filter(x => x.excaName === exca),
          }

          haulers.push(obj)
        }

        for (let x of haulers) {
          const excaNameFromExcel = (await MasEquipment.query().where('kode', x.excaName).first()).toJSON()

          if (req.exca_id === String(excaNameFromExcel.id)) {
            const tempArr = []
            for (const y of x.haulers) {
              if (y.bm) {
                tempArr.push({
                  excaName: x.excaName,
                  materials: 'blasting',
                  haulers: x.haulers.filter(v => v.bm),
                })
              }

              if (y.ob) {
                tempArr.push({
                  excaName: x.excaName,
                  materials: 'ob',
                  haulers: x.haulers.filter(v => v.ob),
                })
              }

              if (y.mud) {
                tempArr.push({
                  excaName: x.excaName,
                  materials: 'mud',
                  haulers: x.haulers.filter(v => v.mud),
                })
              }

              if (y.coal) {
                tempArr.push({
                  excaName: x.excaName,
                  materials: 'coal',
                  haulers: x.haulers.filter(v => v.coal),
                })
              }
            }
          }
        }

        return result
      }
    }
  }

  async GET_MONTH_EXCEL_DATA_PRODUCTION(filePath, req, usr) {
    const sampleSheet = req.sheet || 'OB'

    const xlsx = excelToJson({
      sourceFile: filePath,
      header: 1,
    })

    var t0 = performance.now()
    let durasi

    const data = []
    const monthLength = moment(req.date).daysInMonth()
    const endIndex = xlsx[sampleSheet].findIndex(v => !v.F)

    const sheetData = xlsx[sampleSheet].slice(1)
    const daysArr = Array.from({ length: monthLength }).map((v, i) => {
      return moment(req.date).startOf('month').add(i, 'day').format('YYYY-MM-DD')
    })

    let sheetIndexs = 0
    let sheetIndexLog = ''
    let originalData = []
    let originalDataIDs = []

    for (const value of sheetData) {
      if (value.E && value.M && value.S) {
        sheetIndexs += 1
        const obj = {
          date: moment(value.A).add(1, 'day').format('YYYY-MM-DD'),
          shift: value.B,
          exca: value.E,
          pitName: value.H,
          material: value.R === 14 ? 'Lumpur' : value.J,
          hauler: value.M,
          distance: value.P,
          totalRitase: value.Q,
          bucketCapacity: value.R,
          bcmRtiase: value.S,
          bcmAccumulate: value.U,
          sheetIndex: sheetIndexs,
        }
        sheetIndexLog += `${sheetIndexs} \n \n`
        originalData.push(obj)
        originalDataIDs.push(sheetIndexs)
        data.push(obj)
      }
    }

    console.log('data >> ', data)

    const daysData = []
    for (const day of daysArr) {
      const obj = {
        date: day,
        data: data.filter(v => v.date === day),
      }
      daysData.push(obj)
    }

    const tempData = []

    const shifts = (await MasShift.query().fetch()).toJSON().map(v => v.kode)

    for (const value of daysData) {
      for (const data of value.data) {
        tempData.push({
          date: value.date,
          excaName: data.exca,
          shift: data.shift,
          material: data.material,
          pitName: data.pitName,
        })
      }
    }

    const GET_DATA_BY_SHIFT_AND_DATE = (shift, date) => {
      let result = []
      for (const data of tempData) {
        if (data.shift === shift && data.date === date) result.push(data)
      }

      return result
    }

    const shiftData = []
    for (const day of daysArr) {
      for (const shift of shifts) {
        const obj = {
          date: day,
          shiftName: shift,
          data: GET_DATA_BY_SHIFT_AND_DATE(shift, day),
        }
        shiftData.push(obj)
      }
    }

    const GET_DATA_BY_EXCA_NAME = (excaName, date, shift) => {
      let result = {}

      for (const data of tempData) {
        if (data.excaName === excaName && data.date === date && data.shift === shift) {
          result = data
        }
      }
      return result
    }

    const _temp = []
    for (const data of shiftData) {
      const obj = {
        date: data.date,
        shift: data.shiftName,
        excas: _.uniq(data.data.map(v => v.excaName)),
      }

      _temp.push(obj)
    }

    const __temp = []
    for (const data of _temp) {
      let obj = {
        date: data.date,
        shift: data.shift,
      }

      let excaData = []
      for (const exca of data.excas) {
        excaData.push(GET_DATA_BY_EXCA_NAME(exca, data.date, data.shift))
      }
      obj = {
        ...obj,
        excaData,
      }

      __temp.push(obj)
    }

    const GET_DATA = (date, shift, exca, material, pitName) => {
      let result = []

      for (const value of data) {
        if (value.shift === shift && value.date === date && value.exca === exca && value.material === material && value.pitName === pitName) {
          result.push(value)
        }
      }
      return result
    }

    const _temp_ = []
    for (const value of __temp) {
      let haulers = []
      for (const data of value.excaData) {
        haulers.push({
          ...data,
          haulers: GET_DATA(data.date, data.shift, data.excaName, data.material, data.pitName),
        })
      }

      const obj = {
        ...value,
        excaData: haulers,
      }

      _temp_.push(obj)
    }

    // FINAL DATA AFTER PARSING FROM EXCEL
    const finalData = _temp_.filter(v => v.excaData && v.excaData.length > 0)

    const GET_SHIFT_DATA = async kode => {
      let startShift = null

      const shifts = (await MasShift.query().fetch()).toJSON()

      for (const shift of shifts) {
        if (shift.kode === kode) {
          startShift = shift.start_shift
        }
      }

      return startShift
    }

    const dailyFleetCreated = []
    const dailyRitaseDetailCreated = []
    let totalBCM = []
    let _totalRitase = []
    let toCompare = []
    let toComparePit = []
    let txtLog = ''
    let indexLog = ''
    let toCompareArr = []
    let toCompareIDs = []

    // CREATE THE DAILY FLEET
    for (const value of finalData) {
      console.log('final data date >> ', value.date)
      // EXCA
      for (const data of value.excaData) {
        const EXCA_NAME = data.excaName.replace(' ', '').replace('00', '0')

        let GET_EXCA_ID = await MasEquipment.query().where('kode', EXCA_NAME).first()

        if (GET_EXCA_ID) {
          GET_EXCA_ID = GET_EXCA_ID?.id
        } else {
          const masEquipment = new MasEquipment()
          const TEMP_EXCA = {
            kode: EXCA_NAME,
            unit_sn: `TEMP__${Math.random() * 99999999}`,
            tipe: 'excavator',
            brand: 'sany',
            unit_model: 'SY500H',
            qty_capacity: 2.7,
            fuel_capacity: 680,
            satuan: 'bcm',
            engine_model: '00',
            engine_sn: 'TEMP__' + EXCA_NAME,
            received_date: '2021-12-01',
            received_hm: 1.0,
            dealer_id: null,
            created_by: 2,
            img_uri: 'http://offices.mitraabadimahakam.id/images/equipments/excavator.jpg',
          }

          masEquipment.fill(TEMP_EXCA)

          await masEquipment.save()

          GET_EXCA_ID = masEquipment.id
        }

        console.log('================================== ', EXCA_NAME, ' ==================================')

        const dailyFleet = new DailyFleet()

        let PIT_NAME = data.pitName.toUpperCase()

        console.log('PIT NAME >> ', PIT_NAME)
        if (PIT_NAME === 'DERAWAN') {
          PIT_NAME = 'DERAWAN BARU'
        }

        const GET_PIT_ID = (await MasPit.query().where('name', PIT_NAME).first())?.id
        const GET_SHIFT_ID = (await MasShift.query().where('kode', data.shift).first())?.id

        const GET_MATERIAL_DATA = await MasMaterial.query().where('name', data.material).first()

        // DEFINE THE DAILY FLEET DATA
        dailyFleet.fill({
          fleet_id: PIT_NAME === 'RPU' ? 23 : PIT_NAME === 'DERAWAN BARU' ? 21 : PIT_NAME === 'RIDWAN' ? 27 : PIT_NAME === 'ANDI MANGKONA' ? 28 : 29,
          pit_id: GET_PIT_ID,
          shift_id: GET_SHIFT_ID,
          activity_id: 11, // loading OB
          user_id: usr.id,
          date: data.date,
        })

        // SAVE THE DAILY FLEET
        await dailyFleet.save()

        const dailyFleetEquip = new DailyFleetEquipment()

        dailyFleetEquip.fill({
          dailyfleet_id: dailyFleet.id,
          equip_id: GET_EXCA_ID,
          datetime: `${data.date} ${await GET_SHIFT_DATA(data.shift)}`,
        })
        await dailyFleetEquip.save()

        const dailyRitaseCheck = await DailyRitase.query()
          .where(wh => {
            wh.where('pit_id', GET_PIT_ID)
            wh.andWhere('shift_id', GET_SHIFT_ID)
            wh.andWhere('exca_id', GET_EXCA_ID)
            wh.andWhere('material', GET_MATERIAL_DATA?.id)
            wh.andWhere('distance', data.haulers[0].distance)
            wh.andWhere('date', data.date)
          })
          .first()

        let dailyRitase = null
        if (dailyRitaseCheck) {
          dailyRitase = dailyRitaseCheck

          console.log('using existing daily ritase id >> ', dailyRitaseCheck.id)

          console.log(' --- starting deleting all ritase detail for id ' + dailyRitaseCheck.id + ' ---')

          await DailyRitaseDetail.query().where('dailyritase_id', dailyRitaseCheck.id).delete()

          console.log(' --- finished deleting all ritase detail for id ' + dailyRitaseCheck.id + ' ---')
        } else {
          const dR = new DailyRitase()
          dR.fill({
            dailyfleet_id: dailyFleet.id,
            exca_id: GET_EXCA_ID,
            material: GET_MATERIAL_DATA?.id,
            distance: data.haulers ? data.haulers[0].distance : 0,
            date: data.date,
            user_id: usr.id,
            description: 'back date upload',
          })

          /// aosdkok

          await dR.save()

          dailyRitase = dR.toJSON()

          console.log('creating new daily ritase id >> ', dR.id)
        }

        dailyFleetCreated.push(dailyFleet.id)
        // HAULERS
        let indexs = 0
        for (const hauler of data.haulers) {
          indexs += 1
          const HAULER_NAME = hauler.hauler.replace(' ', '')

          let GET_HAULER_ID = await MasEquipment.query().where('kode', HAULER_NAME).first()

          if (GET_HAULER_ID) {
            GET_HAULER_ID = GET_HAULER_ID?.id
          } else {
            const masEquipment = new MasEquipment()
            const TEMP_EXCA = {
              kode: HAULER_NAME,
              unit_sn: `TEMP__${Math.random() * 99999999}`,
              tipe: 'hauler truck',
              brand: 'lgmg',
              unit_model: 'CMT96',
              qty_capacity: 2.7,
              fuel_capacity: 680,
              satuan: 'bcm',
              engine_model: '00',
              engine_sn: 'TEMP__' + HAULER_NAME,
              received_date: '2021-12-01',
              received_hm: 1.0,
              dealer_id: null,
              created_by: 2,
              img_uri: 'http://offices.mitraabadimahakam.id/images/equipments/dump_truck.jpg',
            }

            masEquipment.fill(TEMP_EXCA)

            await masEquipment.save()

            GET_HAULER_ID = masEquipment.id
          }

          const dailyFleetEquip = new DailyFleetEquipment()

          dailyFleetEquip.fill({
            dailyfleet_id: dailyFleet.id,
            equip_id: GET_HAULER_ID,
            datetime: `${data.date} ${await GET_SHIFT_DATA(data.shift)}`,
          })

          await dailyFleetEquip.save()
          let countRitase = 0

          _totalRitase.push(parseInt(hauler.totalRitase))

          indexLog += `${hauler.sheetIndex} \n \n`

          txtLog += `${hauler.sheetIndex} - ${data.date} - ${data.shift} - ${data.excaName} - ${data.pitName} - ${data.material} - ${hauler.hauler} - ${hauler.distance} - ${hauler.totalRitase}
                         \n`

          toCompareArr.push({
            sheetIndex: hauler.sheetIndex,
            date: data.date,
            shift: data.shift,
            excaName: data.excaName,
            pitName: data.pitName,
            material: data.material,
            hauler: hauler.hauler,
            distance: hauler.distance,
            totalRitase: hauler.totalRitase,
          })

          toCompareIDs.push(hauler.sheetIndex)
          for (let totalRitase = 1; totalRitase <= parseInt(hauler.totalRitase); totalRitase++) {
            countRitase += 1

            toCompare.push(`${data.pitName} - ${data.shift} - ${data.date} - ${data.excaName} - ${data.material} - ${hauler.hauler} - ${hauler.totalRitase}
                              `)

            toComparePit.push({
              pitName: data.pitName === 'PIT DERAWAN' ? 'PIT DERAWAN BARU' : data.pitName,
              shift: data.shift,
              date: data.date,
              excaName: data.excaName,
              material: data.material,
              hauler: hauler.hauler,
              totalRitase: hauler.totalRitase,
            })

            const dailyritaseDetail = new DailyRitaseDetail()

            dailyritaseDetail.fill({
              dailyritase_id: dailyRitase.id,
              checker_id: 28,
              spv_id: 8,
              hauler_id: GET_HAULER_ID,
              opr_id: null,
              check_in: `${data.date} ${await GET_SHIFT_DATA(data.shift)}`,
            })

            await dailyritaseDetail.save()
            dailyRitaseDetailCreated.push(dailyritaseDetail.id)
          }

          // 20 is ADT bcm max capacity
          totalBCM.push(9 * parseInt(hauler.totalRitase))
          console.log(
            `---- Finished creating data for ${data.date} - ${EXCA_NAME} - ${data.shift} - ${HAULER_NAME} - ${PIT_NAME} - ${GET_MATERIAL_DATA.name} - ${countRitase} RIT  ${
              9 * parseInt(hauler.totalRitase)
            } BCM ---- `
          )
        }
      }
    }

    console.log('----- INSERT TO DATABASE FINISHED ------ \n \n')

    try {
      // CHECK IF ALL DATA INSERTED CORRECTLY
      const originalDataLength = originalData.length
      const insertedDataLength = toCompareArr.length

      const GET_DATA_BY_ID = id => {
        let result = null
        for (const value of originalData) {
          if (value.sheetIndex === id) {
            result = value
          }
        }
        return result
      }

      if (insertedDataLength !== originalDataLength) {
        // check the index difference
        const difference = _.difference(originalDataIDs, toCompareIDs)

        console.log('------ STARTING INSERT EXCLUDED DATA TO DATABASE ------ ')

        // get the missing data from the original sheet data
        const data = []
        for (const index of difference) {
          data.push(GET_DATA_BY_ID(index))
        }

        // create days array
        const daysData = []
        for (const day of daysArr) {
          const obj = {
            date: day,
            data: data.filter(v => v.date === day),
          }
          daysData.push(obj)
        }

        const tempData = []

        const shifts = (await MasShift.query().fetch()).toJSON().map(v => v.kode)

        for (const value of daysData) {
          for (const data of value.data) {
            tempData.push({
              date: value.date,
              excaName: data.exca,
              shift: data.shift,
              material: data.material,
              pitName: data.pitName,
            })
          }
        }

        const GET_DATA_BY_SHIFT_AND_DATE = (shift, date) => {
          let result = []
          for (const data of tempData) {
            if (data.shift === shift && data.date === date) result.push(data)
          }

          return result
        }

        const shiftData = []
        for (const day of daysArr) {
          for (const shift of shifts) {
            const obj = {
              date: day,
              shiftName: shift,
              data: GET_DATA_BY_SHIFT_AND_DATE(shift, day),
            }
            shiftData.push(obj)
          }
        }

        const GET_DATA_BY_EXCA_NAME = (excaName, date, shift) => {
          let result = {}

          for (const data of tempData) {
            if (data.excaName === excaName && data.date === date && data.shift === shift) {
              result = data
            }
          }
          return result
        }

        const _temp = []
        for (const data of shiftData) {
          const obj = {
            date: data.date,
            shift: data.shiftName,
            excas: _.uniq(data.data.map(v => v.excaName)),
          }

          _temp.push(obj)
        }

        const __temp = []
        for (const data of _temp) {
          let obj = {
            date: data.date,
            shift: data.shift,
          }

          let excaData = []
          for (const exca of data.excas) {
            excaData.push(GET_DATA_BY_EXCA_NAME(exca, data.date, data.shift))
          }
          obj = {
            ...obj,
            excaData,
          }

          __temp.push(obj)
        }

        const GET_DATA = (date, shift, exca, material, pitName) => {
          let result = []

          for (const value of data) {
            if (value.shift === shift && value.date === date && value.exca === exca && value.material === material && value.pitName === pitName) {
              result.push(value)
            }
          }
          return result
        }

        const _temp_ = []
        for (const value of __temp) {
          let haulers = []
          for (const data of value.excaData) {
            haulers.push({
              ...data,
              haulers: GET_DATA(data.date, data.shift, data.excaName, data.material, data.pitName),
            })
          }

          const obj = {
            ...value,
            excaData: haulers,
          }

          _temp_.push(obj)
        }

        // FINAL DATA AFTER PARSING FROM EXCEL
        const finalData = _temp_.filter(v => v.excaData && v.excaData.length > 0)

        console.log('missing indexs final data >> ', finalData)

        const GET_SHIFT_DATA = async kode => {
          let startShift = null

          const shifts = (await MasShift.query().fetch()).toJSON()

          for (const shift of shifts) {
            if (shift.kode === kode) {
              startShift = shift.start_shift
            }
          }

          return startShift
        }

        // CREATE THE DAILY FLEET
        for (const value of finalData) {
          // EXCA
          for (const data of value.excaData) {
            const EXCA_NAME = data.excaName.replace(' ', '').replace('00', '0')

            let GET_EXCA_ID = await MasEquipment.query().where('kode', EXCA_NAME).first()

            if (GET_EXCA_ID) {
              GET_EXCA_ID = GET_EXCA_ID?.id
            } else {
              const masEquipment = new MasEquipment()
              const TEMP_EXCA = {
                kode: EXCA_NAME,
                unit_sn: `TEMP__${Math.random() * 99999999}`,
                tipe: 'excavator',
                brand: 'sany',
                unit_model: 'SY500H',
                qty_capacity: 2.7,
                fuel_capacity: 680,
                satuan: 'bcm',
                engine_model: '00',
                engine_sn: 'TEMP__' + EXCA_NAME,
                received_date: '2021-12-01',
                received_hm: 1.0,
                dealer_id: null,
                created_by: 2,
                img_uri: 'http://offices.mitraabadimahakam.id/images/equipments/excavator.jpg',
              }

              masEquipment.fill(TEMP_EXCA)

              await masEquipment.save()

              GET_EXCA_ID = masEquipment.id
            }

            const dailyFleet = new DailyFleet()

            let PIT_NAME = data.pitName.toUpperCase()

            if (PIT_NAME === 'DERAWAN') {
              PIT_NAME = 'DERAWAN BARU'
            }

            const GET_PIT_ID = (await MasPit.query().where('name', PIT_NAME).first())?.id
            const GET_SHIFT_ID = (await MasShift.query().where('kode', data.shift).first())?.id
            const GET_FLEET_ID = await MasFleet.query()
              .where(wh => {
                wh.where('pit_id', GET_PIT_ID)
                wh.where('tipe', 'OB')
              })
              .last()
            const GET_MATERIAL_DATA = await MasMaterial.query().where('name', data.material).first()

            // DEFINE THE DAILY FLEET DATA
            dailyFleet.fill({
              fleet_id: PIT_NAME === 'RPU' ? 23 : PIT_NAME === 'DERAWAN BARU' ? 21 : PIT_NAME === 'RIDWAN' ? 27 : PIT_NAME === 'ANDI MANGKONA' ? 28 : 29,
              pit_id: GET_PIT_ID,
              shift_id: GET_SHIFT_ID,
              activity_id: 11, // loading OB
              user_id: usr.id,
              date: data.date,
            })

            // SAVE THE DAILY FLEET
            await dailyFleet.save()

            const dailyFleetEquip = new DailyFleetEquipment()

            dailyFleetEquip.fill({
              dailyfleet_id: dailyFleet.id,
              equip_id: GET_EXCA_ID,
              datetime: `${data.date} ${await GET_SHIFT_DATA(data.shift)}`,
            })
            await dailyFleetEquip.save()

            const dailyRitaseCheck = await DailyRitase.query()
              .where(wh => {
                wh.where('pit_id', GET_PIT_ID)
                wh.andWhere('shift_id', GET_SHIFT_ID)
                wh.andWhere('exca_id', GET_EXCA_ID)
                wh.andWhere('material', GET_MATERIAL_DATA?.id)
                wh.andWhere('distance', data.haulers[0].distance)
                wh.andWhere('date', data.date)
              })
              .first()

            let dailyRitase = null
            if (dailyRitaseCheck) {
              dailyRitase = dailyRitaseCheck

              console.log('using existing daily ritase id >> ', dailyRitaseCheck.id)

              console.log(' --- starting deleting all ritase detail for id ' + dailyRitaseCheck.id + ' ---')

              await DailyRitaseDetail.query().where('dailyritase_id', dailyRitaseCheck.id).delete()

              console.log(' --- finished deleting all ritase detail for id ' + dailyRitaseCheck.id + ' ---')
            } else {
              const dR = new DailyRitase()
              dR.fill({
                dailyfleet_id: dailyFleet.id,
                exca_id: GET_EXCA_ID,
                material: GET_MATERIAL_DATA?.id,
                distance: data.haulers ? data.haulers[0].distance : 0,
                date: data.date,
                user_id: usr.id,
                description: 'back date upload',
              })

              await dR.save()

              dailyRitase = dR.toJSON()

              console.log('creating new daily ritase id >> ', dR.id)
            }

            // HAULERS
            let indexs = 0
            for (const hauler of data.haulers) {
              indexs += 1
              const HAULER_NAME = hauler.hauler.replace(' ', '')

              let GET_HAULER_ID = await MasEquipment.query().where('kode', HAULER_NAME).first()

              if (GET_HAULER_ID) {
                GET_HAULER_ID = GET_HAULER_ID?.id
              } else {
                const masEquipment = new MasEquipment()
                const TEMP_EXCA = {
                  kode: HAULER_NAME,
                  unit_sn: `TEMP__${Math.random() * 99999999}`,
                  tipe: 'hauler truck',
                  brand: 'lgmg',
                  unit_model: 'CMT96',
                  qty_capacity: 2.7,
                  fuel_capacity: 680,
                  satuan: 'bcm',
                  engine_model: '00',
                  engine_sn: 'TEMP__' + HAULER_NAME,
                  received_date: '2021-12-01',
                  received_hm: 1.0,
                  dealer_id: null,
                  created_by: 2,
                  img_uri: 'http://offices.mitraabadimahakam.id/images/equipments/dump_truck.jpg',
                }

                masEquipment.fill(TEMP_EXCA)

                await masEquipment.save()

                GET_HAULER_ID = masEquipment.id
              }

              const dailyFleetEquip = new DailyFleetEquipment()

              dailyFleetEquip.fill({
                dailyfleet_id: dailyFleet.id,
                equip_id: GET_HAULER_ID,
                datetime: `${data.date} ${await GET_SHIFT_DATA(data.shift)}`,
              })

              await dailyFleetEquip.save()
              let countRitase = 0

              _totalRitase.push(parseInt(hauler.totalRitase))

              for (let totalRitase = 1; totalRitase <= parseInt(hauler.totalRitase); totalRitase++) {
                countRitase += 1

                const dailyritaseDetail = new DailyRitaseDetail()

                dailyritaseDetail.fill({
                  dailyritase_id: dailyRitase.id,
                  checker_id: 28,
                  spv_id: 8,
                  hauler_id: GET_HAULER_ID,
                  opr_id: null,
                  check_in: `${data.date} ${await GET_SHIFT_DATA(data.shift)}`,
                })

                await dailyritaseDetail.save()
              }
              totalBCM.push(GET_MATERIAL_DATA.vol * parseInt(hauler.totalRitase))
              console.log(
                `---- missing indexs finished ${data.date} - ${EXCA_NAME} - ${data.shift} - ${HAULER_NAME} - ${PIT_NAME} - ${GET_MATERIAL_DATA.name} - ${countRitase} RIT  ${
                  GET_MATERIAL_DATA.vol * parseInt(hauler.totalRitase)
                } BCM ---- `
              )
            }
          }
        }
      }
    } catch (err) {
      throw new Error(err)
    }

    // GET THE NUMBER OF RITASE ACROSS ALL PIT
    const GET_PIT_DATA = pitName => {
      let arr = []
      for (const value of toComparePit) {
        if (value.pitName === pitName) {
          arr.push(value)
        }
      }

      return arr.length
    }

    const ARRAY_PIT = (await MasPit.query().whereIn('id', [1, 2, 6]).fetch())?.toJSON()

    let resultPit = []

    for (const pitName of ARRAY_PIT) {
      const obj = {
        pitName: pitName,
        data: GET_PIT_DATA(`PIT ${pitName.name}`),
      }
      resultPit.push(obj)
    }

    console.log(
      'total bcm >> ',
      totalBCM.reduce((a, b) => a + b, 0)
    )
    console.log(
      'total ritase >> ',
      _totalRitase.reduce((a, b) => a + b, 0)
    )
    console.log('----- TASK FINISHED -----')
    console.log(' at ' + moment().format('YYYY-MM-DD HH:mm:ss') + ' ')

    console.log('row inserted across all pit >> ', resultPit)
    // END OF GET NUMBER OF RITAES ACROSS ALL PIT

    // WRITE TO TXT FILE FOR THE LOG
    // log data inserted
    fs.writeFile('log.txt', txtLog, (err, data) => {
      if (err) {
        console.error(err)
      }

      console.log('txt data >> ', data)
      console.log('----- finished writing to txt file ------ ')
    })

    // sheet data indexs
    fs.writeFile('log1.txt', sheetIndexLog, (err, data) => {
      if (err) {
        console.error(err)
      }

      console.log('txt data >> ', data)
      console.log('----- finished writing to txt file ------ ')
    })

    // inserted data indexs
    fs.writeFile('log2.txt', indexLog, (err, data) => {
      if (err) {
        console.error(err)
      }

      console.log('txt data >> ', data)
      console.log('----- finished writing to txt file ------ ')
    })

    durasi = await diagnoticTime.durasi(t0)

    console.log(` ------ SCRIPT FINISHED IN ${durasi} ------`)

    // END OF WRITE TO TXT FILE FOR THE LOG

    return {
      data: dailyFleetCreated,
      dr: dailyRitaseDetailCreated.length,
    }
  }
}

module.exports = new Ritase()
