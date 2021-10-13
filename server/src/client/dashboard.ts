import { Dashboard } from './modules/dashboardHelper'
import { reloadInterval} from './modules/reloadHelper'

// Find location
// location is star of 'admin' is in url
let loc = window.location.pathname.split('/')[1]
if (loc === 'admin') { loc = '*' }

const dashboard = new Dashboard(loc)

// Reload the page every night
reloadInterval()