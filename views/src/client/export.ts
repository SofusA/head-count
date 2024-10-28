import { DateTime } from "luxon";
import { Database } from "./modules/database";
import ApexCharts from "apexcharts";

const loc = window.location.pathname.split("/")[1];

// initiate database
const supabase = new Database(loc);

interface formEvent {
  elements: {
    startDate: {
      value: string;
    };
    stopDate: {
      value: string;
    };
  };
}

const form = document.querySelector("#form")!;

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const target: formEvent = e.target as unknown as formEvent;

  const start = DateTime.fromISO(target.elements.startDate.value);
  const stop = DateTime.fromISO(target.elements.stopDate.value).plus({
    days: 1,
  });
  collect(start, stop).then((data) => {
    if (data.total != null && data.nightowls != null) {
      const totalVisitors = document.getElementById("totalVisitors")!;
      totalVisitors.innerHTML = data.total.toString();

      const nightOwls = document.getElementById("nightOwls")!;
      nightOwls.innerHTML = data.nightowls.toString();

      const monitor = document.getElementById("monitor")!;
      monitor.classList.remove("hidden");
    }
  });
});

const collect = async (start: DateTime, stop: DateTime) => {
  const dbData =
    (await supabase.getInData(start.toMillis(), stop.toMillis())) ?? [];
  const nightowls = await supabase.countNightOwls(
    start.toMillis(),
    stop.toMillis(),
  );

  const dataset: { x: string; y: number }[] = [];

  for (const row of dbData.sort((a, b) => a.time - b.time)) {
    const rowDate = new Date(row.time).toLocaleDateString();
    const day = dataset.find((x) => x.x === rowDate);

    if (day === undefined) {
      dataset.push({ x: rowDate, y: 1 });
    } else {
      day.y++;
    }
  }

  options.series.push({
    name: `From ${start.toLocaleString()} to ${stop
      .plus({ days: -1 })
      .toLocaleString()}`,
    data: dataset,
  });
  var chart = new ApexCharts(document.querySelector("#chart"), options);

  chart.render();

  return { total: dbData?.length, nightowls: nightowls };
};

// Update navbar links
const linkToStatus = document.getElementById("linkToStatus");
if (linkToStatus instanceof HTMLAnchorElement) {
  linkToStatus.href = `/${loc}/Status`;
}
const linkToDashboard = document.getElementById("linkToDashboard");
if (linkToDashboard instanceof HTMLAnchorElement) {
  linkToDashboard.href = `/${loc}/`;
}
const linkToExport = document.getElementById("linkToExport");
if (linkToExport instanceof HTMLAnchorElement) {
  linkToExport.href = `/${loc}/export`;
}
const linkToMonitor = document.getElementById("linkToMonitor");
if (linkToMonitor instanceof HTMLAnchorElement) {
  linkToMonitor.href = `/${loc}/Monitor`;
}

var options = {
  series: [] as Array<{ name: string; data: { x: string; y: number }[] }>,
  chart: {
    type: "bar",
    height: 350,
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: "55%",
      endingShape: "rounded",
    },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    show: true,
    width: 2,
    colors: ["transparent"],
  },
  xaxis: {},
  yaxis: {
    title: {
      text: "Entries",
    },
  },
  fill: {
    opacity: 1,
  },
  tooltip: {
    y: {
      formatter: function (val: any) {
        return `${val} entries`;
      },
    },
  },
};
