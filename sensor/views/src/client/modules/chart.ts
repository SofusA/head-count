import { DateTime } from 'luxon'
import ApexCharts from 'apexcharts'

interface IDictionary {
    [index: string]: {
        [index: string]: string
    };
}

export class Chart {
    private chart: any

    private options = {
        series: [],
        colors: [''],
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
                formatter: (n: any) => {
                    const relativeDates = ['Monday', 'Tuesday', 'Wednessday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                    const today = DateTime.now().toFormat('c')

                    return (n === today ? 'Today' : `Last ${relativeDates[n - 1]}`); // return today or the day of the week
                }
            },
        },
        yaxis: {
            labels: {
                formatter: (n: any) => {
                    if (n.length === 0) { return n } // weird but fixes unknown chart series
                    return (n < 10 ? '0' : '') + n + ":00";
                }
            }
        },
        tooltip: {
            y: {
                formatter: (n: any) => n,
                title: {
                    formatter: (n: any) => `Visitors at ${(n < 10 ? '0' : '') + n + ":00"}:`,
                },
            },
        }
    };

    private formatMeasurements = (input:any) => {
        // Define start and stop of the calendar hours
        const startHour = 6
        const stopHour = 19
        let calendarObject: IDictionary = {}
    
        // Construct calendar object which holds all hours and all days under that (yeah i know its weirds)
        for (let hour = startHour; hour < stopHour; hour++) {
            calendarObject[hour] = {}
            for (let day = 1; day <= 7; day++) {
                calendarObject[hour][day] = '0'
            }
        }
    
        // insert measurements into the calendarObject
        for (const measurement of input) {
            const time = DateTime.fromMillis(measurement.time)
            if (calendarObject[time.toFormat('H')]) { // if the hour exists
                if (calendarObject[time.toFormat('H')][time.toFormat('c')]) { // if it is the right day
                    let newCount = parseInt(calendarObject[time.toFormat('H')][time.toFormat('c')]) || 0
                    newCount += measurement.direction_in
                    newCount += measurement.direction_out
                    calendarObject[time.toFormat('H')][time.toFormat('c')] = String(newCount)
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

    updateChart = (data: any) => {
        this.chart.updateSeries(this.formatMeasurements(data))
    }

    constructor(chartLocation: string, colour: string) {
        this.options.colors = [colour]

        this.chart = new ApexCharts(document.querySelector(`#${chartLocation}`), this.options);
        this.chart.render();
    }
}