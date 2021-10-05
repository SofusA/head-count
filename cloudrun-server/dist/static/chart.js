let DateTime = luxon.DateTime;
import { getInData } from './subscribe.js'

// let colour = '#D58296'
const setColour = (c) => {
    options['colors'] = [c]
    document.documentElement.style.setProperty('--main-color', c);
    chart.updateOptions(options)
}

const updateChart = async (location) => {
    const start = DateTime.now().startOf('day').plus({
        week: -1
    }).toMillis()
    const stop = DateTime.now().endOf('day').toMillis()
    let data = await getInData(location, start, stop)

    chart.updateSeries(formatMeasurements(data, start, stop))

    return data
}

const formatMeasurements = (input, start, stop) => {
    // Define start and stop of the calendar hours
    const startHour = 6
    const stopHour = 19
    let calendarObject = {}

    // Construct calendar object which holds all hours and all days under that (yeah i know its weirds)
    for (let hour = startHour; hour < stopHour; hour++) {
        calendarObject[hour] = {}
        for (let i = 1; i <= 7; i++) {
            calendarObject[hour][i] = '0'
        }
    }

    // insert measurements into the calendarObject
    for (const measurement of input) {
        const time = DateTime.fromMillis(measurement.time)
        if (calendarObject[time.toFormat('H')]) {
            if (calendarObject[time.toFormat('H')][time.toFormat('c')]) {
                calendarObject[time.toFormat('H')][time.toFormat('c')]++ || 1
            }
        }
    }

    // format to heatmeat format
    let heatmapData = []
    for (const [hour, count] of Object.entries(calendarObject)) {
        let countArray = []
        for (const [day, counts] of Object.entries(count)) {
            countArray.push({
                x: day,
                y: counts
            })
        }
        heatmapData.push({
            name: hour,
            data: countArray
        })
    }

    return heatmapData.reverse()
}

var options = {
    series: [],
    chart: {
        height: '100%',
        type: 'heatmap',
        toolbar: {
            show: false
        }
    },
    animations: {
        enabled: false
    },
    dataLabels: {
        enabled: false
    },
    xaxis: {
        labels: {
            formatter: (n) => {
                const relativeDates = ['Monday', 'Tuesday', 'Wednessday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                const today = DateTime.now().toFormat('c')

                return (n === today ? 'Today' : `Last ${relativeDates[n-1]}`); // return today or the day of the week
            }
        },
    },
    yaxis: {
        labels: {
            formatter: (n) => {
                return (n < 10 ? '0' : '') + n + ":00";
            }
        }
    },
    tooltip: {
        y: {
            formatter: (n) => n,
            title: {
                formatter: (n) => `Visitors at ${(n < 10 ? '0' : '') + n + ":00"}:`,
            },
        },
    }
};
var chart = new ApexCharts(document.querySelector("#chart"), options);
chart.render();

export { updateChart, setColour }