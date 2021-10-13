import { DateTime } from 'luxon'
import { Database } from './modules/database'

interface IDictionary {
    [index: string]: string;
}

const loc = window.location.pathname.split('/')[1]

// initiate database
const supabase = new Database(loc)

interface formEvent {
    elements: {
        startDate: {
            value: string
        },
        stopDate: {
            value: string
        }
    }
}

const form = document.querySelector('#form')!


form.addEventListener('submit', (e) => {
    e.preventDefault()

    const target: formEvent = e.target as unknown as formEvent

    const start = DateTime.fromISO(target.elements.startDate.value).toMillis()
    const stop = DateTime.fromISO(target.elements.stopDate.value).plus({ days: 1 }).toMillis()


    collect(loc, start, stop).then(data => {
        if (data === null) {
            return
        }

        // measurements = formatMeasurements(data, start, stop)
        let dataFormattet = []
        for (let row of data) {
            dataFormattet.push({
                time: DateTime.fromMillis(row.time).toISO(),
                door: row.door,
                direction_in: row.direction_in,
                direction_out: row.direction_out
            })
        }

        // Download the data
        const replacer = (key: any, value: any) => value === null ? '' : value // specify how you want to handle null values here
        const header = Object.keys(dataFormattet[0])
        const csv = [
            header.join(','), // header row first
            ...dataFormattet.map((row: IDictionary) => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
        ].join('\r\n')

        var pom = document.createElement('a');
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        pom.href = url;
        pom.setAttribute('download', 'data.csv');
        pom.click();
    })

})



const collect = async (loc: string, start: number, stop: number) => {
    const data = await supabase.getData(start, stop)
    return data
}

// Update navbar links
const linkToStatus = document.getElementById('linkToStatus')
if (linkToStatus instanceof HTMLAnchorElement) {
    linkToStatus.href = `/${loc}/Status`
}
const linkToDashboard = document.getElementById('linkToDashboard')
if (linkToDashboard instanceof HTMLAnchorElement) {
    linkToDashboard.href = `/${loc}/`
}
const linkToExport = document.getElementById('linkToExport')
if (linkToExport instanceof HTMLAnchorElement) {
    linkToExport.href = `/${loc}/export`
}
const linkToMonitor = document.getElementById('linkToMonitor')
if (linkToMonitor instanceof HTMLAnchorElement) {
    linkToMonitor.href = `/${loc}/Monitor`
}