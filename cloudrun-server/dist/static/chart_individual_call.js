let DateTime = luxon.DateTime;
import { countData } from './subscribe.js'

const supabaseUrl = 'https://flpcdxxaexyriudizhty.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyNjQyNzkyOCwiZXhwIjoxOTQyMDAzOTI4fQ.XoT5qhcfNYapF_rDJxzokPX9eOGCB0hzBW5crHvcnoA'
const db = supabase.createClient(supabaseUrl, supabaseKey)


// let colour = '#D58296'
const setColour = (c) => {
    options['colors'] = [c]
    document.documentElement.style.setProperty('--main-color', c);
    // chart.updateOptions(options)
}

const updateChart = async (location) => {
    const start = DateTime.now().startOf('day').plus({
        week: -1
    }).toMillis()

    formatMeasurements(location).then(r => {
        options.series = r

        var chart = new ApexCharts(document.querySelector("#chart"), options);
        chart.render();

        // chart.updateSeries(r)
    })

    return 'Updated chart'
}

const formatMeasurements = async (location) => {
    // Define start and stop of the calendar hours
    const startHour = 6
    const stopHour = 19
    let calendar = []

    for (let hour = startHour; hour < stopHour; hour++) {
        let hourArray = []
        for (let day = 1; day <= 7; day++) {

            const todayOfTheWeek = DateTime.now().toFormat('c')

            let fromTime = DateTime.now().startOf('day').startOf('week').plus({ day: day - 1, hour: hour })
            let toTime = DateTime.now().startOf('day').startOf('week').plus({ day: day - 1, hour: hour + 1 })

            if (day > todayOfTheWeek) {
                fromTime = fromTime.plus({ week: -1 })
                toTime = toTime.plus({ week: -1 })
            }

            const { data, error, count } = await db
                .from('counter')
                .select('*', { count: 'exact', head: true })
                .eq('location', location)
                .eq('direction_in', 1)
                .gt('time', fromTime.toMillis())
                .lt('time', toTime.toMillis())

            hourArray.push({
                x: day,
                y: count
            })
        }
        calendar.push({
            name: hour,
            data: hourArray
        })
    }

    console.log(calendar.reverse())

    return calendar//.reverse()
}

var options = {
    series: [],
    xaxis: {
        categories: [1, 2, 3, 4, 5, 6, 7]
    },
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
    // xaxis: {
    //     labels: {
    //         formatter: (n) => {
    //             const relativeDates = ['Monday', 'Tuesday', 'Wednessday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    //             const today = DateTime.now().toFormat('c')

    //             return (n === today ? 'Today' : `Last ${relativeDates[n - 1]}`); // return today or the day of the week
    //         }
    //     },
    // },
    // yaxis: {
    //     labels: {
    //         formatter: (n) => {
    //             return (n < 10 ? '0' : '') + n + ":00";
    //         }
    //     }
    // },
    tooltip: {
        y: {
            formatter: (n) => n,
            title: {
                formatter: (n) => `Visitors at ${(n < 10 ? '0' : '') + n + ":00"}:`,
            },
        },
    }
};


export { updateChart, setColour }