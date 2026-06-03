import { Dashboard } from "./modules/dashboardHelper";
import { reloadInterval } from "./modules/reloadHelper";

// For github.com/head-count. Added +1
let loc = window.location.pathname.split("/")[1 + 1];
if (loc === "admin") {
  loc = "*";
}

const dashboard = new Dashboard(loc);

reloadInterval();
