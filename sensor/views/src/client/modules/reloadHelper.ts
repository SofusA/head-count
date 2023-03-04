// Reload at night
import { DateTime } from 'luxon'

let reloadAtNight = () => {
    const now = DateTime.now().toMillis()
    // reload at 03:00
    let reloadTime = DateTime.now().startOf('day').plus({ hours: 3 }).toMillis()
    reloadTime = reloadTime - now
    if (reloadTime < 0) {
        reloadTime += 86400000; // it's after 03, try tomorrow.
    }
    return reloadTime;
}

const reloadInterval = () => {
    setTimeout(function () { location.reload() }, reloadAtNight());
}

export { reloadInterval }