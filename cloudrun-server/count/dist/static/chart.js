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
    // construct object
    let timeArray = {}
    for (let i = 0; i < 7; i++) {
        timeArray[i] = {}
        for (let j = 6; j < 19; j++) {
            timeArray[i][j] = '0'
        }
    }

    // insert the data
    for (const measurement of input) {

        if (timeArray[toRelativeDays(measurement.time)]) {
            if (timeArray[toRelativeDays(measurement.time)][DateTime.fromMillis(measurement.time).toFormat('H')]) {
                timeArray[toRelativeDays(measurement.time)][DateTime.fromMillis(measurement.time).toFormat('H')]++ || 1
            }
        }
    }

    // format to heatmeat
    let heatmapData = []
    for (const [day, count] of Object.entries(timeArray)) {
        let countArray = []
        for (const [time, counts] of Object.entries(count)) {
            countArray.push({
                x: time,
                y: counts
            })
        }

        heatmapData.push({
            name: day,
            data: countArray
        })
    }

    return heatmapData
}

const toRelativeDays = (timestamp) => {
    const now = DateTime.now().startOf('day')
    const day = DateTime.fromMillis(timestamp).startOf('day')

    return Math.trunc(now.diff(day, "days").toObject().days)
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
    // colors: [color],
    yaxis: {
        labels: {
            formatter: function (n) {
                const relativeDates = ['Today', 'Yesteday', ' days ago']
                return (n >= 2 ? n + relativeDates[2] : relativeDates[n])
            }
        },
    },
    xaxis: {
        labels: {
            formatter: function (n) {
                return (n < 10 ? '0' : '') + n + ":00";
            }
        }
    }
};
var chart = new ApexCharts(document.querySelector("#chart"), options);
chart.render();

export { updateChart, setColour}