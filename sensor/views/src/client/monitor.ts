import { reloadInterval } from './modules/reloadHelper'
import { Monitor } from './modules/monitorHelper'

// Find location
// location is star of 'admin' is in url
let loc = window.location.pathname.split('/')[1]
if (loc === 'admin') { loc = '*' }

const monitor = new Monitor(loc)

// Reload the page every night
reloadInterval()

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