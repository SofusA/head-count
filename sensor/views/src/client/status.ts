import { Database } from './modules/database'
import { StatusHelper } from './modules/statusHelper'
import { reloadInterval } from './modules/reloadHelper'

// Find location
// location is star of 'admin' is in url
let loc = window.location.pathname.split('/')[1]
if (loc === 'admin') { loc = '*' }

// initiate database
const supabase = new Database(loc)

// Initiate table
const table = new StatusHelper('cameraTable')

// Define update function
async function update() {
    const sensorlist = await supabase.getSensorList()
    table.updateTable(sensorlist)
};
update(); // fist time update

// Subscribe to changes in the database. Update if changes
const subscribe = supabase.subscribe(() => update())

// Refresh table every 30 seconds
setInterval(function () { table.updateTable() }, 30000);

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