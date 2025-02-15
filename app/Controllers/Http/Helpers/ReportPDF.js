'use strict'

const Helpers = use('Helpers')
const _ = require('underscore')
const moment = require('moment')
// const MasEvent = use("App/Models/MasEvent")
// const DailyFleet = use("App/Models/DailyFleet")
const DailyRitase = use("App/Models/DailyRitase")
// const DailyRitaseDetail = use("App/Models/DailyRitaseDetail")
const MonthlyPlan = use("App/Models/MonthlyPlan")
const DailyPlan = use("App/Models/DailyPlan")
const MasPit = use("App/Models/MasPit")
const MasSite = use("App/Models/MasSite")
// const MasShift = use("App/Models/MasShift")
const MasMaterial = use("App/Models/MasMaterial")
const MamFuelRatio = use("App/Models/MamFuelRatio")
const VRitaseObPerjam = use("App/Models/VRitaseObPerjam")
const Image64Helpers = use("App/Controllers/Http/Helpers/_EncodingImage")


class PDFReport {
    async RIT_PER_JAM(start, end){

        const jumlahData = (await VRitaseObPerjam.query()
        .with('dailyritase')
        .with('hauler')
        .where(w => {
            w.where('check_in', '>=', `${start}`)
            w.where('check_in', '<=', `${end}`)
        })
        .orderBy([{ column: 'check_in', order: 'desc' }, { column: 'exca_id', order: 'asc' }])
        .fetch()).toJSON()

        // console.log(jumlahData);
        
        let result = jumlahData.map(item => {
            return {
                exca_unit: item.kode,
                exca_tot_rit: item.dailyritase.tot_ritase,
                exca_productivity: parseFloat(item.dailyritase.tot_ritase) * parseFloat(item.vol),
                jarak: item.distance,
                volume: item.vol,
                hauler_unit: item.hauler.kode,
                jum: 1,
            }
        })
        
        let groupingData = result.reduce(function (obj, item) {
            obj[item.exca_unit] = obj[item.exca_unit] || [];
            obj[item.exca_unit].push({
                jarak: item.jarak,
                volume: item.volume,
                hauler_unit: item.hauler_unit,
                rit: 1
            });    
            return obj;
        }, {});
        
        groupingData = Object.keys(groupingData).map(function (key) {    
            return {exca_unit: key, details: groupingData[key]}
        });
        
        // console.log(JSON.stringify(groupingData, null, 2));
        return groupingData
    }

    async MONTHLY_OB_PDF (req, grafikPath) {

        if(req.pit_id === 'undefined' || req.pit_id === 'null'){
            req.pit_id = null
        }
        
        let monthlyPlan
        try {
            monthlyPlan = (
                await MonthlyPlan.query()
                .with('daily_plan')
                .where( w => {
                    if(req.pit_id){
                        w.where('pit_id', req.pit_id)
                    }
                    w.where('tipe', 'OB')
                    w.where('month', '>=', moment(req.month_begin).startOf('month').format('YYYY-MM-DD'))
                    w.where('month', '<=', moment(req.month_end).endOf('month').format('YYYY-MM-DD'))
                }).orderBy([{ column: 'pit_id'}, { column: 'month' }]).fetch()
            ).toJSON()
        } catch (error) {
            console.log(error);
        }

        
        let result = []
        result.push([
            { text: 'Location', style: 'tableHeader_L' },
            { text: 'Periode', style: 'tableHeader_L' },
            { text: 'Target', style: 'tableHeader_R' },
            { text: 'Actual', style: 'tableHeader_R' },
            { text: 'Diff', style: 'tableHeader_R' }
        ])


        for (const obj of monthlyPlan) {
            const pit = await MasPit.query().where('id', obj.pit_id).last()
            
            for (const [i, val] of obj.daily_plan.entries()) {
                result.push([
                    {text: pit.name, style: 'tableCell_L'},
                    {text: moment(val.current_date).format('DD-MM-YYYY'), style: 'tableCell_L'},
                    {text: val.estimate, style: 'tableCell_R'},
                    {text: val.actual, style: 'tableCell_R'},
                    {text: (parseFloat(val.actual) - parseFloat(val.estimate)).toFixed(2), style: 'tableCell_R'},
                ])
            }
            result.push([
                {
                    text: `TOTAL ${pit.name} - (${moment(obj.month).format('MMMM YYYY')})`, 
                    colSpan: 2, 
                    alignment: 'left', 
                    bold: true, 
                    fontSize: 8,
                    fillColor: '#75A5E3', 
                    margin: [5, 3, 5, 3]
                },
                {},
                {
                    text: `${(obj.estimate).toLocaleString('id-ID')} BCM`,
                    alignment: 'right', 
                    bold: true,
                    fontSize: 8,
                    fillColor: '#75A5E3', 
                    margin: [5, 3, 5, 3]
                },
                {
                    text: `${(obj.actual).toLocaleString('id-ID')} BCM`,
                    alignment: 'right', 
                    bold: true,
                    fontSize: 8,
                    fillColor: '#75A5E3', 
                    margin: [5, 3, 5, 3]
                },
                {
                    text: `${(parseFloat(obj.actual) - parseFloat(obj.estimate)).toLocaleString('id-ID')} BCM`,
                    alignment: 'right', 
                    bold: true,
                    fontSize: 8,
                    fillColor: '#75A5E3', 
                    margin: [5, 3, 5, 3]
                },
            ])
        }

        // console.log(result);
        const site = await MasSite.query().where('id', req.site_id).last()
        const imgPath = Helpers.publicPath('logo.jpg')
        const logoAsBase64 = await Image64Helpers.GEN_BASE64(imgPath)
        const chartPath = grafikPath ? Helpers.publicPath(grafikPath):null
        const chartAsBase64 = chartPath ? await Image64Helpers.GEN_BASE64(chartPath):null

        let objImages = grafikPath ? {image: chartAsBase64, width: 500}: {text: ''}
        const dataTitle = [
            {
                columns: [
                    {
                        width: 100,
                        fit: [80, 80],
                        image: `${logoAsBase64}`
                    },
                    [
                        {text: 'Monthly Production Report', style: 'title'},
                        {
                            columns: [
                                [
                                    {
                                        alignment: 'justify',
                                        columns: [
                                            {
                                                width: 50,
                                                style: 'subtitle',
                                                text: 'Periode '
                                            },
                                            {
                                                style: 'subtitle',
                                                text: `: ${moment(req.month_begin).format('MMMM YYYY')} s/d ${moment(req.month_end).format('MMMM YYYY')}`
                                            }
                                        ]
                                    },
                                    {
                                        alignment: 'justify',
                                        columns: [
                                            {
                                                width: 50,
                                                style: 'subtitle',
                                                text: 'Site '
                                            },
                                            {
                                                style: 'subtitle',
                                                text: `: ${site.name}`
                                            }
                                        ]
                                    },
                                    {
                                        alignment: 'justify',
                                        columns: [
                                            {
                                                width: 50,
                                                style: 'subtitle',
                                                text: 'Pit '
                                            },
                                            {
                                                style: 'subtitle',
                                                text: ': All Pit'
                                            }
                                        ]
                                    },
                                    {text: '', margin: [0, 0, 0, 5]},
                                ]
                            ]
                        }
                    ]
                ]
            },
            {text: '\n'},
            objImages,
            // {image: chartAsBase64, width: grafikPath ? 500 : 0},
            {text: '\n'},
            {
                style: 'tableExample',
                layout: 'headerLineOnly',
                table: {
                    headerRows: 1,
                    widths: ['auto', '*', 80, 80, 'auto'],
                    body: result
                }
            }
        ]

        const dd = {
            styles: {
                title: {
                    fontSize: 16,
                    bold: true,
                    margin: [0, 0, 0, 5]
                },
                subtitle: {
                    fontSize: 10,
                    italics: true
                },
                tableHeader_L: {
                    fillColor: '#E6E6E6',
                    bold: true,
                    alignment: 'left'
                },
                tableHeader_R: {
                    fillColor: '#E6E6E6',
                    bold: true,
                    alignment: 'right'
                },
                tableCell_L: {
                    fillColor: '#FFF',
                    fontSize: 8,
                    alignment: 'left'
                },
                tableCell_R: {
                    fillColor: '#FFF',
                    fontSize: 8,
                    alignment: 'right'
                }
            },
            content: dataTitle,
        }
        // console.log(JSON.stringify(dd, null, 2));
        return dd
    }

    async WEEKLY_OB_PDF(req, grafikPath){
        console.log('weekly====================================');
        console.log(req);
        console.log('====================================');

        var x = moment(req.week_begin).week()
        var y = moment(req.week_end).week()
        // console.log(x, y);

        let arrDate = []
        for (let i = x - 1; i < y; i++) {
            var str = '-W'+'0'.repeat(2 - `${i}`.length) + i
            var arrStart = moment(moment(req.week_begin).format('YYYY') + str).startOf('week').add(1, 'day')
            var arrEnd = moment(moment(req.week_end).format('YYYY') + str).endOf('week').add(1, 'day')

            var getDaysBetweenDates = function(startDate, endDate) {
                var now = startDate.clone(), dates = [];
          
                while (now.isSameOrBefore(endDate)) {
                    dates.push(now.format('YYYY-MM-DD'));
                    now.add(1, 'days');
                }
                return dates;
            };
            arrDate.push({
                date: 'WEEK-'+i,
                items: getDaysBetweenDates(arrStart, arrEnd)
            })
        }

        let data = []
        for (const obj of arrDate) {
            let tmp = []

            if(req.pit_id === 'undefined' || req.pit_id === 'null'){
                req.pit_id = null
            }

            const dataWeekly = (await DailyPlan.query().where( w => {
                if(req.pit_id){
                    w.where('pit_id', req.pit_id)
                }
                w.where('tipe', 'OB')
                w.where('current_date', '>=', _.first(obj.items))
                w.where('current_date', '<=', _.last(obj.items))
            }).orderBy('pit_id').fetch()).toJSON()

            for (const val of dataWeekly) {
                const pit = await MasPit.query().where('id', val.pit_id).last()
                const site = await MasSite.query().where('id', val.site_id).last()
                tmp.push({
                    site_id: val.site_id,
                    site_nm: site.name,
                    pit_id: val.pit_id,
                    pit_nm: pit.name,
                    estimate: val.estimate,
                    actual: val.actual,
                    diff: parseFloat(val.actual) - parseFloat(val.estimate),
                    date: moment(val.current_date).format('YYYY-MM-DD')
                })
            }
            const pit = await MasPit.query().where('id', req.pit_id).last()
            const site = await MasSite.query().where('id', req.site_id).last()
            data.push({
                week: obj.date,
                date_begin: _.first(obj.items),
                date_end: _.last(obj.items),
                estimate: (dataWeekly.reduce((a, b) => { return a + b.estimate }, 0)).toFixed(2),
                actual: (dataWeekly.reduce((a, b) => { return a + b.actual }, 0)).toFixed(2),
                pit_nm: pit?.name || 'ALL PIT',
                site_nm: site.name,
                items: tmp
            })
        }

        

        const site = await MasSite.query().where('id', req.site_id).last()
        const pit = await MasPit.query().where('id', req.pit_id).last()
        const imgPath = Helpers.publicPath('logo.jpg')
        const imageAsBase64 = await Image64Helpers.GEN_BASE64(imgPath)
        const chartPath = grafikPath ? Helpers.publicPath(grafikPath):null
        const chartAsBase64 = chartPath ? await Image64Helpers.GEN_BASE64(chartPath):null

        let objImages = grafikPath ? {image: chartAsBase64, width: 500}: {text: ''}

        let result = []
        result.push([
            { text: 'Location', style: 'tableHeader_L' },
            { text: 'Periode', style: 'tableHeader_L' },
            { text: 'Target', style: 'tableHeader_R' },
            { text: 'Actual', style: 'tableHeader_R' },
            { text: 'Diff', style: 'tableHeader_R' }
        ])

        for (const obj of data) {
            
            for (const val of obj.items) {
                result.push([
                    {text: val.pit_nm, style: 'tableCell_L'},
                    {text: moment(val.date).format('DD-MM-YYYY'), style: 'tableCell_L'},
                    {text: val.estimate, style: 'tableCell_R'},
                    {text: val.actual, style: 'tableCell_R'},
                    {text: (parseFloat(val.actual) - parseFloat(val.estimate)).toFixed(2), style: 'tableCell_R'},
                ])
            }
            result.push([
                {
                    text: `TOTAL ${obj.week} - (${moment(obj.date_begin).format('DD/MM')} to ${moment(obj.date_end).format('DD/MM')})`, 
                    colSpan: 2, 
                    alignment: 'left', 
                    bold: true, 
                    fontSize: 8,
                    fillColor: '#75A5E3', 
                    margin: [5, 3, 5, 3]
                },
                {},
                {
                    text: `${(obj.estimate)} BCM`,
                    alignment: 'right', 
                    bold: true,
                    fontSize: 8,
                    fillColor: '#75A5E3', 
                    margin: [5, 3, 5, 3]
                },
                {
                    text: `${(obj.actual)} BCM`,
                    alignment: 'right', 
                    bold: true,
                    fontSize: 8,
                    fillColor: '#75A5E3', 
                    margin: [5, 3, 5, 3]
                },
                {
                    text: `${(parseFloat(obj.actual) - parseFloat(obj.estimate)).toFixed(2)} BCM`,
                    alignment: 'right', 
                    bold: true,
                    fontSize: 8,
                    fillColor: '#75A5E3', 
                    margin: [5, 3, 5, 3]
                },
            ])
        }

        const dataTitle = [
            {
                columns: [
                    {
                        width: 100,
                        fit: [80, 80],
                        image: `${imageAsBase64}`
                    },
                    [
                        {text: 'Weekly Production Report', style: 'title'},
                        {
                            columns: [
                                [
                                    {
                                        alignment: 'justify',
                                        columns: [
                                            {
                                                width: 50,
                                                style: 'subtitle',
                                                text: 'Periode '
                                            },
                                            {
                                                style: 'subtitle',
                                                text: `: ${moment(req.week_begin).format('DD MMM YYYY')} s/d ${moment(req.week_end).format('DD MMM YYYY')}`
                                            }
                                        ]
                                    },
                                    {
                                        alignment: 'justify',
                                        columns: [
                                            {
                                                width: 50,
                                                style: 'subtitle',
                                                text: 'Site '
                                            },
                                            {
                                                style: 'subtitle',
                                                text: `: ${site.name}`
                                            }
                                        ]
                                    },
                                    {
                                        alignment: 'justify',
                                        columns: [
                                            {
                                                width: 50,
                                                style: 'subtitle',
                                                text: 'Pit '
                                            },
                                            {
                                                style: 'subtitle',
                                                text: `: ${pit?.name || 'All Pit'}`
                                            }
                                        ]
                                    },
                                    {text: '', margin: [0, 0, 0, 5]},
                                ]
                            ]
                        }
                    ]
                ]
            },
            {text: '\n'},
            objImages,
            {text: '\n'},
            {
                style: 'tableExample',
                layout: 'headerLineOnly',
                table: {
                    headerRows: 1,
                    widths: ['auto', '*', 80, 80, 'auto'],
                    body: result
                }
            }
        ]

        const dd = {
            styles: {
                title: {
                    fontSize: 16,
                    bold: true,
                    margin: [0, 0, 0, 5]
                },
                subtitle: {
                    fontSize: 10,
                    italics: true
                },
                tableHeader_L: {
                    fillColor: '#E6E6E6',
                    bold: true,
                    alignment: 'left'
                },
                tableHeader_R: {
                    fillColor: '#E6E6E6',
                    bold: true,
                    alignment: 'right'
                },
                tableCell_L: {
                    fillColor: '#FFF',
                    fontSize: 8,
                    alignment: 'left'
                },
                tableCell_R: {
                    fillColor: '#FFF',
                    fontSize: 8,
                    alignment: 'right'
                }
            },
            content: dataTitle,
        }

        // console.log(JSON.stringify(dd, null, 2));
        return dd
    }

    async DAILY_OB_PDF(req, grafikPath){

        if(req.pit_id === 'undefined' || req.pit_id === 'null'){
            req.pit_id = null
        }

        const dataDaily = (await DailyPlan.query().where( w => {
            if(req.pit_id){
                w.where('pit_id', req.pit_id)
            }
            w.where('tipe', 'OB')
            w.where('current_date', '>=', req.start_date)
            w.where('current_date', '<=', req.end_date)
        }).orderBy([{ column: 'pit_id', order: 'asc' }, { column: 'current_date', order: 'asc' }]).fetch()).toJSON()

        // console.log(dataDaily);

        let result = []
        result.push([
            { text: 'Location', style: 'tableHeader_L' },
            { text: 'Periode', style: 'tableHeader_L' },
            { text: 'Target', style: 'tableHeader_R' },
            { text: 'Actual', style: 'tableHeader_R' },
            { text: 'Diff', style: 'tableHeader_R' }
        ])

        let arrEstimate = []
        let arrActual = []
        for (const obj of dataDaily) {
            let pit = await MasPit.query().where('id', obj.pit_id).last()
            arrEstimate.push(obj.estimate)
            arrActual.push(obj.actual)
            result.push([
                {text: pit.name, style: 'tableCell_L'},
                {text: moment(obj.current_date).format('DD-MM-YYYY'), style: 'tableCell_L'},
                {text: obj.estimate, style: 'tableCell_R'},
                {text: obj.actual, style: 'tableCell_R'},
                {text: (parseFloat(obj.actual) - parseFloat(obj.estimate)).toFixed(2), style: 'tableCell_R'},
            ])
        }

        result.push([
            {
                text: `Grand Total`, 
                colSpan: 2, 
                alignment: 'left', 
                bold: true, 
                fontSize: 8,
                fillColor: '#75A5E3', 
                margin: [5, 3, 5, 3]
            },
            {},
            {
                text: (arrEstimate.reduce((a, b) => { return a + b }, 0)).toFixed(2) + ' BCM',
                alignment: 'right', 
                bold: true,
                fontSize: 8,
                fillColor: '#75A5E3', 
                margin: [5, 3, 5, 3]
            },
            {
                text: (arrActual.reduce((a, b) => { return a + b }, 0)).toFixed(2) + ' BCM',
                alignment: 'right', 
                bold: true,
                fontSize: 8,
                fillColor: '#75A5E3', 
                margin: [5, 3, 5, 3]
            },
            {
                text: ((arrActual.reduce((a, b) => { return a + b }, 0)) - (arrEstimate.reduce((a, b) => { return a + b }, 0))).toFixed(2) + ' BCM',
                alignment: 'right', 
                bold: true,
                fontSize: 8,
                fillColor: '#75A5E3', 
                margin: [5, 3, 5, 3]
            },
        ])

        const site = await MasSite.query().where('id', req.site_id).last()
        const pit = await MasPit.query().where('id', req.pit_id).last()
        const imgPath = Helpers.publicPath('logo.jpg')
        const imageAsBase64 = await Image64Helpers.GEN_BASE64(imgPath)
        const chartPath = grafikPath ? Helpers.publicPath(grafikPath):null
        const chartAsBase64 = chartPath ? await Image64Helpers.GEN_BASE64(chartPath):null

        let objImages = grafikPath ? {image: chartAsBase64, width: 500}: {text: ''}
        const dataTitle = [
            {
                columns: [
                    {
                        width: 100,
                        fit: [80, 80],
                        image: `${imageAsBase64}`
                    },
                    [
                        {text: 'Daily Production Report', style: 'title'},
                        {
                            columns: [
                                [
                                    {
                                        alignment: 'justify',
                                        columns: [
                                            {
                                                width: 50,
                                                style: 'subtitle',
                                                text: 'Periode '
                                            },
                                            {
                                                style: 'subtitle',
                                                text: `: ${moment(req.start_date).format('DD MMMM YYYY')} s/d ${moment(req.end_date).format('DD MMMM YYYY')}`
                                            }
                                        ]
                                    },
                                    {
                                        alignment: 'justify',
                                        columns: [
                                            {
                                                width: 50,
                                                style: 'subtitle',
                                                text: 'Site '
                                            },
                                            {
                                                style: 'subtitle',
                                                text: `: ${site.name}`
                                            }
                                        ]
                                    },
                                    {
                                        alignment: 'justify',
                                        columns: [
                                            {
                                                width: 50,
                                                style: 'subtitle',
                                                text: 'Pit '
                                            },
                                            {
                                                style: 'subtitle',
                                                text: `: ${pit?.name || 'All Pit'}`
                                            }
                                        ]
                                    },
                                    {text: '', margin: [0, 0, 0, 5]},
                                ]
                            ]
                        }
                    ]
                ]
            },
            {text: '\n'},
            objImages,
            {text: '\n'},
            {
                style: 'tableExample',
                layout: 'headerLineOnly',
                table: {
                    headerRows: 1,
                    widths: ['auto', '*', 80, 80, 'auto'],
                    body: result
                }
            }
        ]

        const dd = {
            styles: {
                title: {
                    fontSize: 16,
                    bold: true,
                    margin: [0, 0, 0, 5]
                },
                subtitle: {
                    fontSize: 10,
                    italics: true
                },
                tableHeader_L: {
                    fillColor: '#E6E6E6',
                    bold: true,
                    alignment: 'left'
                },
                tableHeader_R: {
                    fillColor: '#E6E6E6',
                    bold: true,
                    alignment: 'right'
                },
                tableCell_L: {
                    fillColor: '#FFF',
                    fontSize: 8,
                    alignment: 'left'
                },
                tableCell_R: {
                    fillColor: '#FFF',
                    fontSize: 8,
                    alignment: 'right'
                }
            },
            content: dataTitle,
        }
        // console.log(JSON.stringify(dd, null, 2));
        return dd
    }

    async SHIFTLY_OB_PDF(req, grafikPath) {
        console.log('shiftly====================================');
        console.log(req);
        // console.log(img);
        console.log('====================================');

        let arrData
        try {
            arrData = (
                await DailyRitase.query()
                .with('shift')
                .with('pit', w => w.with('site'))
                .where( w => {
                    if(req.shift_id){
                        w.where('shift_id', req.shift_id)
                    }
                    w.where('site_id', req.site_id)
                    w.where('date', '>=', moment(req.start_date).format('YYYY-MM-DD'))
                    w.where('date', '<=', moment(req.end_date).format('YYYY-MM-DD'))
                }).fetch()
            ).toJSON()
        } catch (error) {
            console.log(error);
        }
        
        // console.log(arrData);
        let data = []
        for (const obj of arrData) {
            const material = await MasMaterial.query().where('id', obj.material).last()
            // console.log(moment(obj.date).format('YYYY-MM-DD'));
            // console.log(obj.pit.name);
            data.push({
                site_id: obj.site_id,
                nm_site: obj.pit.site?.name,
                pit_id: obj.pit_id,
                nm_pit: obj.pit.name,
                shift_id: obj.shift_id,
                nm_shift: obj.shift.name,
                kd_shift: obj.shift.kode,
                date: moment(obj.date).format('YYYY-MM-DD'),
                actual: parseFloat(obj.tot_ritase) * parseFloat(material.vol)
            })
        }
        data = _.groupBy(_.sortBy(data, 'nm_pit'), 'nm_pit')
        data = Object.keys(data).map(key => {
            return {
                nm_pit: key,
                items: data[key]
            }
        })

        let tmp = []
        for (const obj of data) {
            let itemx = []
            for (const val of obj.items) {
                const target = await DailyPlan.query().where( w => {
                    w.where('current_date', val.date)
                    w.where('pit_id', val.pit_id)
                }).last()

                var estimasi = parseFloat(target.estimate) / 2
                var diff = parseFloat(val.actual) - (parseFloat(target.estimate) / 2)
                itemx.push({
                    ...val, 
                    estimate: estimasi.toFixed(2),
                    diff: diff.toFixed(2)
                })
            }

            tmp.push({
                ...obj, 
                items: itemx
            })
        }
        // console.log(JSON.stringify(tmp, null, 2));

        let result = []
        result.push([
            { text: 'Location', style: 'tableHeader_L' },
            { text: 'Periode', style: 'tableHeader_L' },
            { text: 'Shift', style: 'tableHeader_L' },
            { text: 'Target', style: 'tableHeader_R' },
            { text: 'Actual', style: 'tableHeader_R' },
            { text: 'Diff', style: 'tableHeader_R' }
        ])

        for (const obj of tmp) {
            var arrEstimate = []
            var arrActual = []
            for (const val of obj.items) {
                arrEstimate.push(parseFloat(val.estimate))
                arrActual.push(parseFloat(val.actual))

                result.push([
                    {text: val.nm_pit, fillColor: val.kd_shift != 'NS' ? '#C4C4C4':'#DDD', fontSize: 8, alignment: 'left'},
                    {text: moment(val.date).format('DD-MM-YYYY'), fillColor: val.kd_shift != 'NS' ? '#C4C4C4':'#DDD', fontSize: 8, alignment: 'left'},
                    {text: val.kd_shift, fillColor: val.kd_shift != 'NS' ? '#C4C4C4':'#DDD', fontSize: 8, alignment: 'left'},
                    {text: val.estimate, fillColor: val.kd_shift != 'NS' ? '#C4C4C4':'#DDD', fontSize: 8, alignment: 'right'},
                    {text: val.actual, fillColor: val.kd_shift != 'NS' ? '#C4C4C4':'#DDD', fontSize: 8, alignment: 'right'},
                    {text: (parseFloat(val.actual) - parseFloat(val.estimate)).toFixed(2), fillColor: val.kd_shift != 'NS' ? '#C4C4C4':'#DDD', fontSize: 8, alignment: 'right'},
                ])
            }

            result.push([
                {
                    text: `Grand Total`, 
                    colSpan: 3, 
                    alignment: 'left', 
                    bold: true, 
                    fontSize: 8,
                    fillColor: '#75A5E3', 
                    margin: [5, 3, 5, 3]
                },
                {},
                {},
                {
                    text: (arrEstimate.reduce((a, b) => { return a + b }, 0)).toFixed(2) + ' BCM',
                    alignment: 'right', 
                    bold: true,
                    fontSize: 8,
                    fillColor: '#75A5E3', 
                    margin: [5, 3, 5, 3]
                },
                {
                    text: (arrActual.reduce((a, b) => { return a + b }, 0)).toFixed(2) + ' BCM',
                    alignment: 'right', 
                    bold: true,
                    fontSize: 8,
                    fillColor: '#75A5E3', 
                    margin: [5, 3, 5, 3]
                },
                {
                    text: ((arrActual.reduce((a, b) => { return a + b }, 0)) - (arrEstimate.reduce((a, b) => { return a + b }, 0))).toFixed(2) + ' BCM',
                    alignment: 'right', 
                    bold: true,
                    fontSize: 8,
                    fillColor: '#75A5E3', 
                    margin: [5, 3, 5, 3]
                },
            ])
        }

        const site = await MasSite.query().where('id', req.site_id).last()
        const pit = await MasPit.query().where('id', req.pit_id).last()
        const imgPath = Helpers.publicPath('logo.jpg')
        const imageAsBase64 = await Image64Helpers.GEN_BASE64(imgPath)
        const chartPath = grafikPath ? Helpers.publicPath(grafikPath):null
        const chartAsBase64 = chartPath ? await Image64Helpers.GEN_BASE64(chartPath):null

        let objImages = grafikPath ? {image: chartAsBase64, width: 500}: {text: ''}
        const dataTitle = [
            {
                columns: [
                    {
                        width: 100,
                        fit: [80, 80],
                        image: `${imageAsBase64}`
                    },
                    [
                        {text: 'Daily Production Report', style: 'title'},
                        {
                            columns: [
                                [
                                    {
                                        alignment: 'justify',
                                        columns: [
                                            {
                                                width: 50,
                                                style: 'subtitle',
                                                text: 'Periode '
                                            },
                                            {
                                                style: 'subtitle',
                                                text: `: ${moment(req.start_date).format('DD MMMM YYYY')} s/d ${moment(req.end_date).format('DD MMMM YYYY')}`
                                            }
                                        ]
                                    },
                                    {
                                        alignment: 'justify',
                                        columns: [
                                            {
                                                width: 50,
                                                style: 'subtitle',
                                                text: 'Site '
                                            },
                                            {
                                                style: 'subtitle',
                                                text: `: ${site.name}`
                                            }
                                        ]
                                    },
                                    {
                                        alignment: 'justify',
                                        columns: [
                                            {
                                                width: 50,
                                                style: 'subtitle',
                                                text: 'Pit '
                                            },
                                            {
                                                style: 'subtitle',
                                                text: `: ${pit?.name || 'All Pit'}`
                                            }
                                        ]
                                    },
                                    {text: '', margin: [0, 0, 0, 5]},
                                ]
                            ]
                        }
                    ]
                ]
            },
            {text: '\n'},
            objImages,
            {text: '\n'},
            {
                style: 'tableExample',
                layout: 'headerLineOnly',
                table: {
                    headerRows: 1,
                    widths: ['auto', '*', 50, 80, 80, 'auto'],
                    body: result
                }
            }
        ]

        const dd = {
            styles: {
                title: {
                    fontSize: 16,
                    bold: true,
                    margin: [0, 0, 0, 5]
                },
                subtitle: {
                    fontSize: 10,
                    italics: true
                },
                tableHeader_L: {
                    fillColor: '#E6E6E6',
                    bold: true,
                    alignment: 'left'
                },
                tableHeader_R: {
                    fillColor: '#E6E6E6',
                    bold: true,
                    alignment: 'right'
                },
                tableCell_L: {
                    fillColor: '#FFF',
                    fontSize: 8,
                    alignment: 'left'
                },
                tableCell_R: {
                    fillColor: '#FFF',
                    fontSize: 8,
                    alignment: 'right'
                }
            },
            content: dataTitle,
        }
        // console.log(JSON.stringify(dd, null, 2));
        return dd
    }

    async HOURLY_OB_PDF(req, grafikPath) {
        console.log(req);
        let resultx = []
        let result = []
        let data 
        
        try {
            data = (
                await VRitaseObPerjam.query().where( w => {
                    if(req.site_id){
                        w.where('site_id', req.site_id)
                    }
                    if(req.group === 'PIT'){
                        w.where('pit_id', req.pit_id)
                    }
                    if(req.date){
                        w.where('tglx', req.date)
                    }
                    if(req.start_date && req.end_date){
                        w.where('check_in', '>=', moment(req.start_date).startOf('hour').format('YYYY-MM-DD HH:mm'))
                        w.where('check_in', '<=', moment(req.end_date).startOf('hour').format('YYYY-MM-DD HH:mm'))
                    }
                }).fetch()
            ).toJSON()
        } catch (error) {
            console.log(error);
        }

        data = _.groupBy(data, 'pit_id')
        data = Object.keys(data).map(key => {
            return {
                pit_id: key,
                items: data[key]
            }
        })
        
        
        // let color = ['#75A5E3', '#1873C8', '#014584']
        for (const [i, obj] of data.entries()) {
            
            var arrData = [];

            const pit = await MasPit.query().where('id', obj.pit_id).last()

            /** GROUPING DATA BY WAKTU **/
            obj.items.reduce(function(res, value) {
              if (!res[value.jamx]) {
                res[value.jamx] = { 
                    jamx: value.jamx, 
                    nm_pit: pit.name, 
                    vol: 0, 
                    kode: value.kode,
                    material: value.name
                };
                arrData.push(res[value.jamx])
              }
              res[value.jamx].vol += value.vol;
              return res;
            }, {});

            
            if(req.start_date && req.end_date){
                var initTime = parseInt(moment(req.start_date).format('H'))
                var endTime = parseInt(moment(req.end_date).format('H'))
                for (let i = initTime; i <= endTime; i++) {
                    var str = '0'.repeat(2 - `${i}`.length) + i
                    if(!arrData.map(el => el.jamx).includes(str)){
                        arrData.push({
                            jamx: str,
                            nm_pit: pit.name,
                            vol: 0,
                        })
                    }
                }
            }

            if(req.date){
                for (let i = 0; i < 24; i++) {
                    var str = '0'.repeat(2 - `${i}`.length) + i
                    if(!arrData.map(el => el.jamx).includes(str)){
                        arrData.push({
                            jamx: str,
                            nm_pit: pit.name,
                            vol: 0
                        })
                    }
                }
            }

            
            
            arrData = _.sortBy(arrData, 'jamx');
            arrData = arrData.map(el => {
                return {
                    pukul: el.jamx + ':00',
                    date: req.date ? moment(req.date).format('DD MMM YYYY'):moment(req.start_date).format('DD MMM YYYY'),
                    nm_pit: pit.name,
                    actual: el.vol,
                    material: el.material || '-',
                    exca: el.kode || '-'
                }
            })
            console.log(arrData);
            resultx.push({
                pit_id: obj.pit_id,
                pit_nm: pit.name,
                actual: arrData.reduce((a, b) => {return a + b.actual}, 0),
                items: arrData
            })
        }
        // console.log('DATA :::', arrData);
        result.push([
            { text: 'Location', style: 'tableHeader_L' },
            { text: 'Date', style: 'tableHeader_L' },
            { text: 'Time', style: 'tableHeader_L' },
            { text: 'Excavator', style: 'tableHeader_L' },
            { text: 'Material', style: 'tableHeader_L' },
            { text: 'Actual', style: 'tableHeader_R' }
        ])

        for (const obj of resultx) {
            for (const val of obj.items) {
                var valDate = val.date || req.start_date
                result.push([
                    {text: val.nm_pit, style: 'tableCell_L'},
                    {text: moment(valDate).format('dddd, DD MMMM YYYY'), style: 'tableCell_L'},
                    {text: val.pukul, style: 'tableCell_L'},
                    {text: val.exca, style: 'tableCell_L'},
                    {text: val.material, style: 'tableCell_L'},
                    {text: val.actual + ' BCM', style: 'tableCell_R'},
                ])
            }
        }

        
        const site = await MasSite.query().where('id', req.site_id).last()
        let pit = null
        if(req.group === 'PIT'){
            pit = await MasPit.query().where('id', req.pit_id).last()
        }
        const imgPath = Helpers.publicPath('logo.jpg')
        const imageAsBase64 = await Image64Helpers.GEN_BASE64(imgPath)
        const chartPath = grafikPath ? Helpers.publicPath(grafikPath):null
        const chartAsBase64 = chartPath ? await Image64Helpers.GEN_BASE64(chartPath):null

        let objImages = grafikPath ? {image: chartAsBase64, width: 500}: {text: ''}
        const dataTitle = [
            {
                columns: [
                    {
                        width: 100,
                        fit: [80, 80],
                        image: `${imageAsBase64}`
                    },
                    [
                        {text: 'Daily Production Report', style: 'title'},
                        {
                            columns: [
                                [
                                    {
                                        alignment: 'justify',
                                        columns: [
                                            {
                                                width: 50,
                                                style: 'subtitle',
                                                text: 'Periode '
                                            },
                                            {
                                                style: 'subtitle',
                                                text: `: ${moment(req.date || req.start_date).format('DD MMMM YYYY')}`
                                            }
                                        ]
                                    },
                                    {
                                        alignment: 'justify',
                                        columns: [
                                            {
                                                width: 50,
                                                style: 'subtitle',
                                                text: 'Site '
                                            },
                                            {
                                                style: 'subtitle',
                                                text: `: ${site.name}`
                                            }
                                        ]
                                    },
                                    {
                                        alignment: 'justify',
                                        columns: [
                                            {
                                                width: 50,
                                                style: 'subtitle',
                                                text: 'Pit '
                                            },
                                            {
                                                style: 'subtitle',
                                                text: `: ${pit?.name || 'All Pit'}`
                                            }
                                        ]
                                    },
                                    {text: '', margin: [0, 0, 0, 5]},
                                ]
                            ]
                        }
                    ]
                ]
            },
            {text: '\n'},
            objImages,
            {text: '\n'},
            {
                style: 'tableExample',
                layout: 'headerLineOnly',
                table: {
                    headerRows: 1,
                    widths: ['auto', '*', 80, 80, '*', 'auto'],
                    body: result
                }
            }
        ]

        const dd = {
            styles: {
                title: {
                    fontSize: 16,
                    bold: true,
                    margin: [0, 0, 0, 5]
                },
                subtitle: {
                    fontSize: 10,
                    italics: true
                },
                tableHeader_L: {
                    fillColor: '#E6E6E6',
                    bold: true,
                    alignment: 'left'
                },
                tableHeader_R: {
                    fillColor: '#E6E6E6',
                    bold: true,
                    alignment: 'right'
                },
                tableCell_L: {
                    fillColor: '#FFF',
                    fontSize: 8,
                    alignment: 'left'
                },
                tableCell_R: {
                    fillColor: '#FFF',
                    fontSize: 8,
                    alignment: 'right'
                }
            },
            content: dataTitle,
        }
        return dd
    }

    /* PDF MONTHLY COAL REPORT */
    // async MONTHLY_COAL_PDF(req, img){
    //     console.log(req);
    // }

    /* PDF FUEL RATIO BY PIT */
    async PIT_FUEL_RATIO_PDF (req) {
        let result = []
        const site = await MasSite.query().where('id', req.site_id).last()
        const pit = await MasPit.query().where('id', req.pit_id).last()
        const logoPath = Helpers.publicPath('logo.jpg')
        const logoAsBase64 = await Image64Helpers.GEN_BASE64(logoPath)
        const chartPath = req.imagePath && Helpers.publicPath(req.imagePath)
        const chartAsBase64 = chartPath && await Image64Helpers.GEN_BASE64(chartPath)
        const addImages = req.imagePath ? {image: chartAsBase64, width: 500} : {text: ""}

        const data = (
            await MamFuelRatio.query().where( w => {
                w.where('site_id', req.site_id)
                w.where('pit_id', req.pit_id)
                w.where('date', '>=', req.start)
                w.where('date', '<=', req.end)
            }).fetch()
        ).toJSON()

        /* TITLE HEADER TABLE DATA */
        result.push([
            { text: 'Location', style: 'tableHeader_L' },
            { text: 'Periode', style: 'tableHeader_L' },
            { text: 'ACT.OB\n(bcm)', style: 'tableHeader_R' },
            { text: 'ACT.Coal\n(bcm)', style: 'tableHeader_R' },
            { text: 'Fuel Used', style: 'tableHeader_R' },
            { text: 'Ratio', style: 'tableHeader_R' },
            { text: 'Cumulative\nProd', style: 'tableHeader_R' },
            { text: 'Cumulative\nFuel', style: 'tableHeader_R' },
            { text: 'Cumulative\nRatio', style: 'tableHeader_R' },
        ])

        /* BODY TABLE DATA */
        for (const obj of data) {
            const pit = await MasPit.query().where('id', obj.pit_id).last()
            result.push([
                {text: pit.name, style: 'tableCell_L'},
                {text: moment(obj.date).format('DD-MM-YYYY'), style: 'tableCell_L'},
                {text: obj.ob, style: 'tableCell_R'},
                {text: obj.coal_bcm, style: 'tableCell_R'},
                {text: obj.fuel_used, style: 'tableCell_R'},
                {text: obj.fuel_ratio, style: 'tableCell_R'},
                {text: obj.cum_production, style: 'tableCell_R'},
                {text: obj.cum_fuel_used, style: 'tableCell_R'},
                {text: obj.cum_fuel_ratio, style: 'tableCell_R'}
            ])
        }

        const PREP_DATA = [
            {
                columns: [
                    {
                        width: 100,
                        fit: [80, 80],
                        image: `${logoAsBase64}`
                    },
                    [
                        {text: 'Fuel Ratio`s Report', style: 'title'},
                        {
                            columns: [
                                [
                                    {
                                        alignment: 'justify',
                                        columns: [
                                            {
                                                width: 50,
                                                style: 'subtitle',
                                                text: 'Periode '
                                            },
                                            {
                                                style: 'subtitle',
                                                text: `: ${moment(req.start).format('DD MMMM YYYY')} s/d ${moment(req.end).format('DD MMMM YYYY')}`
                                            }
                                        ]
                                    },
                                    {
                                        alignment: 'justify',
                                        columns: [
                                            {
                                                width: 50,
                                                style: 'subtitle',
                                                text: 'Site '
                                            },
                                            {
                                                style: 'subtitle',
                                                text: `: ${req.site_id && site.name}`
                                            }
                                        ]
                                    },
                                    {
                                        alignment: 'justify',
                                        columns: [
                                            {
                                                width: 50,
                                                style: 'subtitle',
                                                text: 'Pit '
                                            },
                                            {
                                                style: 'subtitle',
                                                text: `: ${req.pit_id ? pit.name: 'All Pit'}`
                                            }
                                        ]
                                    },
                                    {text: '', margin: [0, 0, 0, 5]},
                                ]
                            ]
                        }
                    ]
                ]
            },
            {text: '\n'},
            addImages,
            {text: '\n'},
            {
                style: 'tableExample',
                layout: 'headerLineOnly',
                table: {
                    headerRows: 1,
                    widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                    body: result
                }
            }
        ]

        /* GENERATE PDF OBJECT WITH DATA */
        const dd = {
            styles: {
                title: {
                    fontSize: 16,
                    bold: true,
                    margin: [0, 0, 0, 5]
                },
                subtitle: {
                    fontSize: 10,
                    italics: true
                },
                tableHeader_L: {
                    fillColor: '#E6E6E6',
                    bold: true,
                    alignment: 'left'
                },
                tableHeader_R: {
                    fillColor: '#E6E6E6',
                    bold: true,
                    alignment: 'right'
                },
                tableCell_L: {
                    fillColor: '#FFF',
                    fontSize: 8,
                    alignment: 'left'
                },
                tableCell_R: {
                    fillColor: '#FFF',
                    fontSize: 8,
                    alignment: 'right'
                }
            },
            content: PREP_DATA,
        }

        return dd
    }

    /* PDF FUEL RATIO BY PERIODE */
    async PERIODE_FUEL_RATIO_PDF (req) {

        let result = []
        let titleDocumentPeriode = ''
        const site = await MasSite.query().where('id', req.site_id).last()
        const logoPath = Helpers.publicPath('logo.jpg')
        const logoAsBase64 = await Image64Helpers.GEN_BASE64(logoPath)
        const chartPath = req.imagePath && Helpers.publicPath(req.imagePath)
        const chartAsBase64 = chartPath && await Image64Helpers.GEN_BASE64(chartPath)
        const addImages = req.imagePath ? {image: chartAsBase64, width: 500} : {text: ""}

        const data = (
            await MamFuelRatio.query().where( w => {
                w.where('site_id', req.site_id)
                w.where('date', '>=', req.start)
                w.where('date', '<=', req.end)
            }).fetch()
        ).toJSON()

        /* TITLE HEADER TABLE DATA */
        result.push([
            { text: 'Location', style: 'tableHeader_L' },
            { text: 'Periode', style: 'tableHeader_L' },
            { text: 'OB (bcm)', style: 'tableHeader_R' },
            { text: 'Coal (bcm)', style: 'tableHeader_R' },
            { text: 'Fuel Used', style: 'tableHeader_R' },
            { text: 'Ratio', style: 'tableHeader_R' }
        ])

        if(req.inp_ranges == 'DAILY'){
            const data = (
                await MamFuelRatio.query().where( w => {
                    w.where('site_id', req.site_id)
                    w.where('date', '>=', req.start)
                    w.where('date', '<=', req.end)
                }).fetch()
            ).toJSON()

            let groupingPIT = _.groupBy(data, 'pit_id')
            groupingPIT = Object.keys(groupingPIT).map(key => {
                return {
                    pit_id: key,
                    items: groupingPIT[key]
                }
            })

            // console.log(groupingPIT);
            titleDocumentPeriode = `: ${moment(req.start).format('DD MMMM YYYY')} s/d ${moment(req.end).format('DD MMMM YYYY')}`
            for (const obj of groupingPIT) {
                // console.log(obj);
                const pit = await MasPit.query().where('id', obj.pit_id).last()
                const sumOB = (obj.items).reduce((a, b) => { return a + parseFloat(b.ob) }, 0)
                const sumCoal = (obj.items).reduce((a, b) => { return a + parseFloat(b.coal_bcm) }, 0)
                const sumFuel = (obj.items).reduce((a, b) => { return a + parseFloat(b.fuel_used) }, 0)
                const ratio = ((sumOB + sumCoal) / sumFuel).toFixed('2')
                for (const val of obj.items) {
                    result.push([
                        {text: pit.name, style: 'tableCell_L'},
                        {text: moment(val.date).format('DD-MM-YYYY'), style: 'tableCell_L'},
                        {text: val.ob, style: 'tableCell_R'},
                        {text: val.coal_bcm, style: 'tableCell_R'},
                        {text: val.fuel_used, style: 'tableCell_R'},
                        {text: val.fuel_ratio, style: 'tableCell_R'}
                    ])
                }

                result.push([
                    {
                        text: `TOTAL `, 
                        colSpan: 2, 
                        alignment: 'left', 
                        bold: true, 
                        fontSize: 8,
                        fillColor: '#75A5E3', 
                        margin: [5, 3, 5, 3]
                    },
                    {},
                    {
                        text: `${sumOB} BCM`,
                        alignment: 'right', 
                        bold: true,
                        fontSize: 8,
                        fillColor: '#75A5E3', 
                        margin: [5, 3, 5, 3]
                    },
                    {
                        text: `${sumCoal} BCM`,
                        alignment: 'right', 
                        bold: true,
                        fontSize: 8,
                        fillColor: '#75A5E3', 
                        margin: [5, 3, 5, 3]
                    },
                    {
                        text: `${sumFuel} BCM`,
                        alignment: 'right', 
                        bold: true,
                        fontSize: 8,
                        fillColor: '#75A5E3', 
                        margin: [5, 3, 5, 3]
                    },
                    {
                        text: ratio,
                        alignment: 'right', 
                        bold: true,
                        fontSize: 8,
                        fillColor: '#75A5E3', 
                        margin: [5, 3, 5, 3]
                    }
                ])
            }
        }

        if(req.inp_ranges == 'WEEKLY'){
            titleDocumentPeriode = `: ${req.start} s/d ${req.end}`

            let arrDate = []

            var x = moment(req.start).week()
            var y = moment(req.end).week()
            for (let i = x - 1; i < y; i++) {
                var str = '-W'+'0'.repeat(2 - `${i}`.length) + i
                var arrStart = moment(moment(req.start).format('YYYY') + str).startOf('week').add(1, 'day')
                var arrEnd = moment(moment(req.end).format('YYYY') + str).endOf('week').add(1, 'day')

                var getDaysBetweenDates = function(startDate, endDate) {
                    var now = startDate.clone(), dates = [];
            
                    while (now.isSameOrBefore(endDate)) {
                        dates.push(now.format('YYYY-MM-DD'));
                        now.add(1, 'days');
                    }
                    return dates;
                };

                var arrTgl = getDaysBetweenDates(arrStart, arrEnd)
                arrDate.push({
                    date: 'WEEK-'+i,
                    site_id: req.site_id,
                    items: arrTgl
                })
            }

            const pit = (
                await MasPit.query().where( w => {
                    w.where('sts', 'Y')
                    w.where('site_id', req.site_id)
                }).fetch()
            ).toJSON()

            let tmp = []
            for (const val of pit) {
                for (const elm of arrDate) {
                    
                    const sumOB = await MamFuelRatio.query().where( w => {
                        w.where('pit_id', val.id)
                        w.where('date', '>=', _.first(elm.items))
                        w.where('date', '<=', _.last(elm.items))
                    }).getSum('ob')

                    const sumCoal = await MamFuelRatio.query().where( w => {
                        w.where('pit_id', val.id)
                        w.where('date', '>=', _.first(elm.items))
                        w.where('date', '<=', _.last(elm.items))
                    }).getSum('coal_bcm')

                    const sumFuel = await MamFuelRatio.query().where( w => {
                        w.where('pit_id', val.id)
                        w.where('date', '>=', _.first(elm.items))
                        w.where('date', '<=', _.last(elm.items))
                    }).getSum('fuel_used')

                    tmp.push({
                        name: val.name,
                        periode: elm.date + '\n' + moment(_.first(elm.items)).format('DD-MM-YY') + ' s/d ' + moment(_.last(elm.items)).format('DD-MM-YY'),
                        vol_ob: sumOB,
                        vol_coal: sumCoal,
                        vol_fuel: sumFuel,
                        ratio: (sumOB + sumCoal) / sumFuel
                    });
                }
            }

            let groupingPIT = _.groupBy(tmp, 'name')
            groupingPIT = Object.keys(groupingPIT).map(key => {
                return {
                    name: key,
                    items: groupingPIT[key]
                }
            })

            for (const obj of groupingPIT) {
                const sumOB = (obj.items).reduce((a, b) => { return a + parseFloat(b.vol_ob) }, 0)
                const sumCoal = (obj.items).reduce((a, b) => { return a + parseFloat(b.vol_coal) }, 0)
                const sumFuel = (obj.items).reduce((a, b) => { return a + parseFloat(b.vol_fuel) }, 0)
                const ratio = ((sumOB + sumCoal) / sumFuel).toFixed('2')
                for (const val of obj.items) {
                    result.push([
                        {text: val.name, style: 'tableCell_L'},
                        {text: val.periode, style: 'tableCell_L'},
                        {text: val.vol_ob, style: 'tableCell_R'},
                        {text: val.vol_coal, style: 'tableCell_R'},
                        {text: val.vol_fuel, style: 'tableCell_R'},
                        {text: (val.ratio).toFixed(2), style: 'tableCell_R'}
                    ])
                }
                result.push([
                    {
                        text: `TOTAL `, 
                        colSpan: 2, 
                        alignment: 'left', 
                        bold: true, 
                        fontSize: 8,
                        fillColor: '#75A5E3', 
                        margin: [5, 3, 5, 3]
                    },
                    {},
                    {
                        text: `${sumOB.toFixed(2)} BCM`,
                        alignment: 'right', 
                        bold: true,
                        fontSize: 8,
                        fillColor: '#75A5E3', 
                        margin: [5, 3, 5, 3]
                    },
                    {
                        text: `${sumCoal.toFixed(2)} BCM`,
                        alignment: 'right', 
                        bold: true,
                        fontSize: 8,
                        fillColor: '#75A5E3', 
                        margin: [5, 3, 5, 3]
                    },
                    {
                        text: `${sumFuel.toFixed(2)} BCM`,
                        alignment: 'right', 
                        bold: true,
                        fontSize: 8,
                        fillColor: '#75A5E3', 
                        margin: [5, 3, 5, 3]
                    },
                    {
                        text: ratio,
                        alignment: 'right', 
                        bold: true,
                        fontSize: 8,
                        fillColor: '#75A5E3', 
                        margin: [5, 3, 5, 3]
                    }
                ])
            }
        }
        if(req.inp_ranges == 'MONTHLY'){
            let arrMonth = []

            var startDate = moment(req.start);
            var endDate = moment(req.end);

            if (endDate.isBefore(startDate)) {
                throw new Error ("End date must be greated than start date.")
            }      

            while (startDate.isSameOrBefore(endDate)) {
                arrMonth.push(startDate.format("YYYY-MM-DD"));
                startDate.add(1, 'month');
            }

            const pit = (
                await MasPit.query().where( w => {
                    w.where('sts', 'Y')
                    w.where('site_id', req.site_id)
                }).fetch()
            ).toJSON()
            
            let tmp = []
            for (const val of pit) {
                for (const elm of arrMonth) {

                    const sumOB = await MamFuelRatio.query().where( w => {
                        w.where('pit_id', val.id)
                        w.where('date', '>=', moment(elm).startOf('month').format('YYYY-MM-DD'))
                        w.where('date', '<=', moment(elm).endOf('month').format('YYYY-MM-DD'))
                    }).getSum('ob') || 0

                    const sumCoal = await MamFuelRatio.query().where( w => {
                        w.where('pit_id', val.id)
                        w.where('date', '>=', moment(elm).startOf('month').format('YYYY-MM-DD'))
                        w.where('date', '<=', moment(elm).endOf('month').format('YYYY-MM-DD'))
                    }).getSum('coal_bcm') || 0

                    const sumFuel = await MamFuelRatio.query().where( w => {
                        w.where('pit_id', val.id)
                        w.where('date', '>=', moment(elm).startOf('month').format('YYYY-MM-DD'))
                        w.where('date', '<=', moment(elm).endOf('month').format('YYYY-MM-DD'))
                    }).getSum('fuel_used') || 0

                    tmp.push({
                        name: val.name,
                        periode: moment(elm).format('MMMM YYYY'),
                        vol_ob: sumOB,
                        vol_coal: sumCoal,
                        vol_fuel: sumFuel,
                        ratio: (sumOB + sumCoal) / sumFuel || 0
                    });
                }
            }
            // console.log(tmp);
            let groupingPIT = _.groupBy(tmp, 'name')
            groupingPIT = Object.keys(groupingPIT).map(key => {
                return {
                    name: key,
                    items: groupingPIT[key]
                }
            })

            for (const obj of groupingPIT) {
                const sumOB = (obj.items).reduce((a, b) => { return a + parseFloat(b.vol_ob) }, 0)
                const sumCoal = (obj.items).reduce((a, b) => { return a + parseFloat(b.vol_coal) }, 0)
                const sumFuel = (obj.items).reduce((a, b) => { return a + parseFloat(b.vol_fuel) }, 0)
                const ratio = ((sumOB + sumCoal) / sumFuel).toFixed('2')
                for (const val of obj.items) {
                    result.push([
                        {text: val.name, style: 'tableCell_L'},
                        {text: val.periode, style: 'tableCell_L'},
                        {text: val.vol_ob, style: 'tableCell_R'},
                        {text: val.vol_coal, style: 'tableCell_R'},
                        {text: val.vol_fuel, style: 'tableCell_R'},
                        {text: (val.ratio).toFixed(2), style: 'tableCell_R'}
                    ])
                }
                result.push([
                    {
                        text: `TOTAL `, 
                        colSpan: 2, 
                        alignment: 'left', 
                        bold: true, 
                        fontSize: 8,
                        fillColor: '#75A5E3', 
                        margin: [5, 3, 5, 3]
                    },
                    {},
                    {
                        text: `${sumOB.toFixed(2)} BCM`,
                        alignment: 'right', 
                        bold: true,
                        fontSize: 8,
                        fillColor: '#75A5E3', 
                        margin: [5, 3, 5, 3]
                    },
                    {
                        text: `${sumCoal.toFixed(2)} BCM`,
                        alignment: 'right', 
                        bold: true,
                        fontSize: 8,
                        fillColor: '#75A5E3', 
                        margin: [5, 3, 5, 3]
                    },
                    {
                        text: `${sumFuel.toFixed(2)} BCM`,
                        alignment: 'right', 
                        bold: true,
                        fontSize: 8,
                        fillColor: '#75A5E3', 
                        margin: [5, 3, 5, 3]
                    },
                    {
                        text: ratio,
                        alignment: 'right', 
                        bold: true,
                        fontSize: 8,
                        fillColor: '#75A5E3', 
                        margin: [5, 3, 5, 3]
                    }
                ])
            }
        }

        const PREP_DATA = [
            {
                columns: [
                    {
                        width: 100,
                        fit: [80, 80],
                        image: `${logoAsBase64}`
                    },
                    [
                        {text: 'Fuel Ratio`s Report', style: 'title'},
                        {
                            columns: [
                                [
                                    {
                                        alignment: 'justify',
                                        columns: [
                                            {
                                                width: 50,
                                                style: 'subtitle',
                                                text: 'Periode '
                                            },
                                            {
                                                style: 'subtitle',
                                                text: titleDocumentPeriode
                                            }
                                        ]
                                    },
                                    {
                                        alignment: 'justify',
                                        columns: [
                                            {
                                                width: 50,
                                                style: 'subtitle',
                                                text: 'Site '
                                            },
                                            {
                                                style: 'subtitle',
                                                text: `: ${site.name}`
                                            }
                                        ]
                                    },
                                    {
                                        alignment: 'justify',
                                        columns: [
                                            {
                                                width: 50,
                                                style: 'subtitle',
                                                text: 'Pit '
                                            },
                                            {
                                                style: 'subtitle',
                                                text: ': All Pit'
                                            }
                                        ]
                                    },
                                    {text: '', margin: [0, 0, 0, 5]},
                                ]
                            ]
                        }
                    ]
                ]
            },
            {text: '\n'},
            addImages,
            {text: '\n'},
            {
                style: 'tableExample',
                layout: 'headerLineOnly',
                table: {
                    headerRows: 1,
                    widths: ['auto', '*', 80, 80, 'auto', 50],
                    body: result
                }
            }
        ]

        /* GENERATE PDF OBJECT WITH DATA */
        const dd = {
            styles: {
                title: {
                    fontSize: 16,
                    bold: true,
                    margin: [0, 0, 0, 5]
                },
                subtitle: {
                    fontSize: 10,
                    italics: true
                },
                tableHeader_L: {
                    fillColor: '#E6E6E6',
                    bold: true,
                    alignment: 'left'
                },
                tableHeader_R: {
                    fillColor: '#E6E6E6',
                    bold: true,
                    alignment: 'right'
                },
                tableCell_L: {
                    fillColor: '#FFF',
                    fontSize: 8,
                    alignment: 'left'
                },
                tableCell_R: {
                    fillColor: '#FFF',
                    fontSize: 8,
                    alignment: 'right'
                }
            },
            content: PREP_DATA,
        }

        return dd
    }

    async KPI_PERFORMANCES (req, data) {
        const { byKPI, dataEvent } = data
        const logoPath = Helpers.publicPath('logo.jpg')
        const logoAsBase64 = await Image64Helpers.GEN_BASE64(logoPath)

        

        var KPIAsBase64
        if(req.imageKPI){
            var KPIPath = Helpers.publicPath(req.imageKPI)
            KPIAsBase64 = await Image64Helpers.GEN_BASE64(KPIPath)
        }else{
            KPIAsBase64 = logoAsBase64
        }

        // var BDPath = Helpers.publicPath(req.imageRatio)
        // var BDAsBase64 = await Image64Helpers.GEN_BASE64(BDPath)

        if(req.imageDuration){
            var DurationPath = Helpers.publicPath(req.imageDuration)
            var DurationAsBase64 = await Image64Helpers.GEN_BASE64(DurationPath)
        }else{
            var DurationAsBase64 = logoAsBase64
        }

        if(req.imageEvent){
            var EventPath = Helpers.publicPath(req.imageEvent)
            var EventAsBase64 = await Image64Helpers.GEN_BASE64(EventPath)
        }else{
            var EventAsBase64 = logoAsBase64 //req.urlKPI
        }

        // console.log(req);

        /* FORMAT DATA KPI PERFORMANCES TO PDFMAKE */
        let dataKPI = byKPI.dataTable.map(v => {
            return [
                {text: v.date},
                {text: (v.actPA)?.toFixed(2), alignment:'center'},
                {text: (v.budgetPA)?.toFixed(2), alignment:'center'},
                {text: (v.actMTBS)?.toFixed(2), alignment:'center'},
                {text: (v.actMTTR)?.toFixed(2), alignment:'center'},
            ]
        })
        dataKPI.unshift([
            {text: 'Periode', fillColor: '#41b3f98f'},
            {text: 'Actual PA', alignment:'center', bold: true, fillColor: '#41b3f98f'},
            {text: 'Budget PA', alignment:'center', fillColor: '#41b3f98f'},
            {text: 'MTBS', alignment:'center', fillColor: '#41b3f98f'},
            {text: 'MTTR', alignment:'center', fillColor: '#41b3f98f'}
        ])

        /* FORMAT DATA DOWNTIME EVENT TO PDFMAKE */
        console.log(dataEvent);
        let dataTopEvent = dataEvent.map(v => {
            return [
                // {text: (v.equipment?.kode || ''), bold: true},
                {
                    stack: [
                        {text: (v.equipment?.kode || ''), bold: true},
                        {
                            ul: [
                                {text: `start: ${moment(v.breakdown_start).format('DD-MM-YY HH:mm')}`, fontSize: 9, listType: 'none'},
                                {text: `finish: ${moment(v.breakdown_finish).format('DD-MM-YY HH:mm')}`, fontSize: 9, listType: 'none'}
                            ]
                        }
                    ]
                },
                {text: v.location+'\n'+v.problem_reported, alignment:'left', fontSize: 9},
                {text: v.downtime_status},
                {text: v.corrective_action, fontSize: 9},
                {text: `${v.downtime_total} Jam`},
                {text: v.component_group},
            ]
        })

        dataTopEvent.unshift([
            {text: 'Equipment', bold: true, fillColor: '#41b3f98f'},
            {text: 'Location', alignment:'left', bold: true, fillColor: '#41b3f98f'},
            {text: 'Description', bold: true, fillColor: '#41b3f98f'},
            {text: 'Action', bold: true, fillColor: '#41b3f98f'},
            {text: 'Duration', bold: true, fillColor: '#41b3f98f'},
            {text: 'Group', bold: true, fillColor: '#41b3f98f'},
        ])

        var dd = {
            content: [
                {text: 'printAt :'+ moment().format('llll'), fontSize: 7, alignment: 'right'},
                {
                    style: 'tableExample',
                    table: {
                        widths: [100, '*', 150],
                        body: [
                            [
                                {
                                    image: `${logoAsBase64}`,
                                    fit: [80, 80],
                                    rowSpan: 2
                                },
                                {text: 'EQUIPMENT PERFORMANCES', alignment:'center', bold: true},
                                {text: 'Site Name', alignment:'center'}
                            ],
                            [
                                {text: 'Logo'},
                                {text: 'MODEL CMT96', alignment:'center', fontSize: 10},
                                {text: 'Bukit Baiduri Energi', alignment:'center', fontSize: 10}
                            ]
                        ]
                    }
                },
                {
                    image: `${KPIAsBase64}`,
                    fit: [515, 300]
                },
                {text: ' \n\n'},
                {text: 'Data Collection details performances\n', bold: true},
                {text: '\n'},
                //table KPI
                {
                    style: 'tableExample',
                    table: {
                        widths: [100, '*', 100, 100, 100],
                        body: dataKPI
                    }
                },
                { text: 'Grafik Top Event\n', fontSize: 14, bold: true, pageBreak: 'before', margin: [0, 0, 0, 8] },
                {text: '\n\n'},
                {
                    alignment: 'justify',
                    columns: [
                        {
                            image: `${EventAsBase64}`,
                            width: 250
                        },
                        {
                            image: `${DurationAsBase64}`,
                            width: 250
                        },
                        
                    ]
                },
                {text: '\n\n'},
                {
                    style: 'tableExample',
                    table: {
                        widths: [100, 100, '*', 100, 50, 50],
                        body: dataTopEvent
                    },
                    layout: 'lightHorizontalLines'
                },
                {text: ' '},
                {text: '\n\n'},
                // {text: 'Grafik Breakdown Ratio\n', bold: true},
                // {text: '\n\n'},
                // {
                //     image: `${BDAsBase64}`,
                //     width: 250
                // },
                
            ],
            footer: function(currentPage, pageCount) { return currentPage.toString() + ' of ' + pageCount; }
        }
        return dd
    }
}

module.exports = new PDFReport()