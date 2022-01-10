import { DateTime } from 'luxon'
import { Database } from './modules/database'

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

    collect(loc, start, stop).then((data) => {
        if (data.total != null && data.nightowls != null) {
            const totalVisitors = document.getElementById('totalVisitors')!
            totalVisitors.innerHTML = data.total.toString();

            const nightOwls = document.getElementById('nightOwls')!
            nightOwls.innerHTML = data.nightowls.toString();

            const monitor = document.getElementById('monitor')!
            monitor.classList.remove("hidden");
        }
    })
})

const collect = async (loc: string, start: number, stop: number) => {
    const total = await supabase.countData(start, stop)
    const nightowls = await supabase.countNightOwls(start, stop)

    return { total: total, nightowls: nightowls }
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