'use strict'

const version = '2.0'
const _ = require('underscore')
const moment = require("moment")
const MasPit = use("App/Models/MasPit")
const MasSite = use("App/Models/MasSite")
const { performance } = require('perf_hooks')
const diagnoticTime = use("App/Controllers/Http/customClass/diagnoticTime")

const ReportPoductionHelpers = use("App/Controllers/Http/Helpers/ReportPoduction")

class ReportProductionController {
    async index ( { auth, request, response } ) {
        let durasi
        var t0 = performance.now()
        var req = request.all()

        console.log(req);
        const user = await userValidate(auth)
        if(!user){
            return response.status(403).json({
                diagnostic: {
                    ver: version,
                    error: true,
                    message: 'not authorized...'
                }
            })
        }
        
        req.range_type = req.group === 'PIT' ? 'MW':'PW'
        req.production_type = req.tipe
        req.colorGraph = [ '#7ab2fa', '#1074f7', '#0451b6', '#fa7a82', '#fa1524', '#a40510' ]

        /* PRODUCTION MONTHLY */
        if(req.ranges === 'MONTHLY'){
            req.month_begin = moment(req.start_date)
            req.month_end = moment(req.end_date)
            try {
                let result = await ReportPoductionHelpers.MW_MONTHLY(req)
                const { xAxis, data } = result
    
                let resp = data[1].items?.map((obj, i) => {
                    return {
                        x: xAxis[i],
                        y: obj.volume
                    }
                })
                durasi = await diagnoticTime.durasi(t0);
                return response.status(200).json({
                    diagnostic: {
                        ver: version,
                        times: durasi,
                        error: false,
                    },
                    data: resp,
                });
            } catch (error) {
                durasi = await diagnoticTime.durasi(t0);
                return response.status(403).json({
                    diagnostic: {
                        ver: version,
                        times: durasi,
                        error: true,
                        message: error,
                    },
                    data: [],
                });
            }
        }

        /* PRODUCTION WEEKLY */
        if(req.ranges === 'WEEKLY'){
            req.week_begin = moment(req.start_date).format('YYYY-MM-DD')
            req.week_end = moment(req.end_date).format('YYYY-MM-DD')

            try {
                let result = await ReportPoductionHelpers.MW_WEEKLY(req)
                const { xAxis, data } = result
    
                let resp = data[1].items?.map((obj, i) => {
                    return {
                        x: xAxis[i],
                        y: obj.volume
                    }
                })
                durasi = await diagnoticTime.durasi(t0);
                return response.status(200).json({
                    diagnostic: {
                        ver: version,
                        times: durasi,
                        error: false,
                    },
                    data: resp,
                });
            } catch (error) {
                durasi = await diagnoticTime.durasi(t0);
                return response.status(403).json({
                    diagnostic: {
                        ver: version,
                        times: durasi,
                        error: true,
                        message: error,
                    },
                    data: [],
                });
            }
        }

        /* PRODUCTION DAILY */
        if(req.ranges === 'DAILY'){
            req.start_date = moment(req.start_date).format('YYYY-MM-DD')
            req.end_date = moment(req.end_date).format('YYYY-MM-DD')

            try {
                let result = await ReportPoductionHelpers.MW_DAILY(req)
                const { short_xAxist, data } = result
    
                let resp = data[1].items?.map((obj, i) => {
                    return {
                        x: short_xAxist[i],
                        y: obj.volume
                    }
                })
                durasi = await diagnoticTime.durasi(t0);
                return response.status(200).json({
                    diagnostic: {
                        ver: version,
                        times: durasi,
                        error: false,
                    },
                    data: resp,
                });
            } catch (error) {
                durasi = await diagnoticTime.durasi(t0);
                return response.status(403).json({
                    diagnostic: {
                        ver: version,
                        times: durasi,
                        error: true,
                        message: error,
                    },
                    data: [],
                });
            }
        }
    }

    async list ( { auth, request, response } ) {
        let durasi
        var t0 = performance.now()
        var req = request.all()

        
        const user = await userValidate(auth)
        if(!user){
            return response.status(403).json({
                diagnostic: {
                    ver: version,
                    error: true,
                    message: 'not authorized...'
                }
            })
        }

        req.range_type = req.group === 'PIT' ? 'MW':'PW'
        req.production_type = req.tipe
        req.colorGraph = [ '#7ab2fa', '#1074f7', '#0451b6', '#fa7a82', '#fa1524', '#a40510' ]

        const pit = await MasPit.query().where('id', req.pit_id).last()
        const site = await MasSite.query().where('id', req.site_id).last()

        /* PRODUCTION MONTHLY */
        if(req.ranges === 'MONTHLY'){
            req.month_begin = moment(req.start_date)
            req.month_end = moment(req.end_date)
            try {
                let result = await ReportPoductionHelpers.MW_MONTHLY(req)

                let resp = []
                for (let i = 0; i < result.xAxis.length; i++) {
                    var diff = (parseFloat(result.data[1].items[i].volume)) - (parseFloat(result.data[0].items[i].volume))
                    resp.push({
                        periode: result.xAxis[i],
                        location: pit.name,
                        kode: pit.kode,
                        target: result.data[0].items[i].volume,
                        actual: result.data[1].items[i].volume,
                        diff: diff,
                        status: diff >= 0 ? 'over target':'low target'
                    })
                    
                }

                durasi = await diagnoticTime.durasi(t0);
                return response.status(200).json({
                    diagnostic: {
                        ver: version,
                        times: durasi,
                        error: false,
                    },
                    data: {
                        site: site.name,
                        data: resp
                    },
                });
            } catch (error) {
                durasi = await diagnoticTime.durasi(t0);
                return response.status(403).json({
                    diagnostic: {
                        ver: version,
                        times: durasi,
                        error: true,
                        message: error,
                    },
                    data: [],
                });
            }
        }

        /* PRODUCTION WEEKLY */
        if(req.ranges === 'WEEKLY'){

            req.week_begin = moment(req.start_date).format('YYYY-MM-DD')
            req.week_end = moment(req.end_date).format('YYYY-MM-DD')

            try {
                let result = await ReportPoductionHelpers.MW_WEEKLY(req)

                let resp = []
                for (let i = 0; i < result.xAxis.length; i++) {
                    var diff = (parseFloat(result.data[1].items[i].volume)) - (parseFloat(result.data[0].items[i].volume))
                    resp.push({
                        periode: result.xAxis[i],
                        location: pit.name,
                        kode: pit.kode,
                        target: result.data[0].items[i].volume,
                        actual: result.data[1].items[i].volume,
                        diff: diff,
                        status: diff >= 0 ? 'over target':'low target'
                    })
                    
                }

                durasi = await diagnoticTime.durasi(t0);
                return response.status(200).json({
                    diagnostic: {
                        ver: version,
                        times: durasi,
                        error: false,
                    },
                    data: {
                        site: site.name,
                        data: resp
                    },
                });
            } catch (error) {
                durasi = await diagnoticTime.durasi(t0);
                return response.status(403).json({
                    diagnostic: {
                        ver: version,
                        times: durasi,
                        error: true,
                        message: error,
                    },
                    data: [],
                });
            }
        }

        /* PRODUCTION DAILY */
        if(req.ranges === 'DAILY'){
            req.start_date = moment(req.start_date).format('YYYY-MM-DD')
            req.end_date = moment(req.end_date).format('YYYY-MM-DD')

            try {
                let result = await ReportPoductionHelpers.MW_DAILY(req)

                let resp = []
                for (let i = 0; i < result.xAxis.length; i++) {
                    var diff = (parseFloat(result.data[1].items[i].volume)) - (parseFloat(result.data[0].items[i].volume))
                    resp.push({
                        periode: result.xAxis[i],
                        location: pit.name,
                        kode: pit.kode,
                        target: result.data[0].items[i].volume,
                        actual: result.data[1].items[i].volume,
                        diff: diff,
                        status: diff >= 0 ? 'over target':'low target'
                    })
                    
                }

                durasi = await diagnoticTime.durasi(t0);
                return response.status(200).json({
                    diagnostic: {
                        ver: version,
                        times: durasi,
                        error: false,
                    },
                    data: {
                        site: site.name,
                        data: resp
                    },
                });
                
            } catch (error) {
                durasi = await diagnoticTime.durasi(t0);
                return response.status(403).json({
                    diagnostic: {
                        ver: version,
                        times: durasi,
                        error: true,
                        message: error,
                    },
                    data: [],
                });
            }
        }
    }
}

module.exports = ReportProductionController

async function userValidate(auth){
    let user
    try {
        user = await auth.authenticator('jwt').getUser()
        return user
    } catch (error) {
        console.log(error);
        return null
    }
}