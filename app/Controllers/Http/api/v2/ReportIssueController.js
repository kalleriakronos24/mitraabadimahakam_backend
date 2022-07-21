'use strict'

const version = '2.0'
const _ = require('underscore')
const moment = require("moment")
const { performance } = require('perf_hooks')
const diagnoticTime = use("App/Controllers/Http/customClass/diagnoticTime")

const DailyIssueHelpers = use("App/Controllers/Http/Helpers/DailyIssue")

class ReportIssueController {
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
        
        try {
            const data = await DailyIssueHelpers.ALL(req)
            durasi = await diagnoticTime.durasi(t0);
            return response.status(200).json({
                diagnostic: {
                    ver: version,
                    times: durasi,
                    error: false,
                },
                data: data,
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

    async today ( { auth, request, response } ) {
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
        
        try {
            const data = await DailyIssueHelpers.SHOW_TODAY(req)
            durasi = await diagnoticTime.durasi(t0);
            return response.status(200).json({
                diagnostic: {
                    ver: version,
                    times: durasi,
                    error: false,
                },
                data: data,
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

module.exports = ReportIssueController

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