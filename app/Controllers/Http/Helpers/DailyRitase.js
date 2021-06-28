'use strict'

const DailyRitase = use("App/models/DailyRitase")
const DailyRitaseDetail = use("App/models/DailyRitaseDetail")

class Ritase {
    async ALL (req) { 
        const limit = 25
        const halaman = req.page === undefined ? 1:parseInt(req.page)
        let dailyRitase
        if(req.keyword){
            dailyRitase = await DailyRitase
                .query()
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
                    whe.where('material', 'like', `%${req.keyword}%`)
                    whe.orWhere('distance', 'like', `%${req.keyword}%`)
                    whe.orWhere('date', 'like', `%${req.keyword}%`)
                })
                .andWhere("status", "Y")
                .orderBy('created_at', 'desc')
                .paginate(halaman, limit)
        }else{
            dailyRitase = await DailyRitase
                .query()
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
                .where("status", "Y")
                .orderBy('created_at', 'desc')
                .paginate(halaman, limit)
        }

        return dailyRitase
    }

    async BY_PIT (params, req) {
        const limit = 25
        const halaman = req.page === undefined ? 1:parseInt(req.page)
        const dailyRitaseDetail = await DailyRitaseDetail
            .query()
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

    async BY_FLEET (params, req) {
        const limit = 25
        const halaman = req.page === undefined ? 1:parseInt(req.page)
        const dailyRitaseDetail = await DailyRitaseDetail
            .query()
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

    async BY_SHIFT (params, req) {
        const limit = 25
        const halaman = req.page === undefined ? 1:parseInt(req.page)
        const dailyRitaseDetail = await DailyRitaseDetail
            .query()
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
}

module.exports = new Ritase()