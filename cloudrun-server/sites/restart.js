    // Reload at night
    let reloadAtNight = () => {
        var now = new Date();
        // reload at 03:00
        var reloadTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 03, 00, 0, 0) - now;
        if (reloadTime < 0) {
          reloadTime += 86400000; // it's after 03, try tomorrow.
        }
        return reloadTime;
      }
setTimeout(function () {  location.reload() }, reloadAtNight());