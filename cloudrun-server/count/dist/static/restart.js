// Reload at night

let DateTime = luxon.DateTime;

let reloadAtNight = () => {
  const now = new Date();
  // reload at 03:00
  let reloadTime = DateTime.now().startOf('day').plus({hours: 3})
  if (reloadTime < 0) {
    reloadTime += 86400000; // it's after 03, try tomorrow.
  }
  return reloadTime;
}
export {reloadAtNight}