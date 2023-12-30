import { Dashboard } from './modules/dashboardHelper'
import { reloadInterval} from './modules/reloadHelper'

let loc = window.location.pathname.split('/')[1]
if (loc === 'admin') { loc = '*' }

const dashboard = new Dashboard(loc)

reloadInterval()