import { DateTime } from 'luxon'
import { Database } from './database'
import { Chart } from './chart'

interface IDictionary {
    [index: string]: string;
}

export class Dashboard {
    private colours: IDictionary = {
        novonordisk: '#01387B',
        skylab: '#FC7634',
        any: '#beeeef'
    }

    private supabase: any
    private subscribe: any

    private loc: string
    private colour: string

    private chart: any

    private setStaticElements(): void {
        // set the colour
        document.documentElement.style.setProperty('--main-color', this.colour);

        // set the "past" element
        const past = document.getElementById('past')!
        past.innerHTML = `${DateTime.now().toFormat('yyyy')} to date`

        // set the year element
        // const year = document.getElementById('year')!
        // year.innerHTML = `${DateTime.now().toFormat('yyyy')} in numbers`
    }

    updateVariableElements = async () => {
        let start = 0
        let stop = 0

        // set firstVisitor
        const firstVisitor = document.getElementById('firstVisitor')!
        firstVisitor.innerHTML = await this.supabase.firstVisitor()

        // set currentVisitors
        const currentVisitors = document.getElementById('currentVisitors')!
        currentVisitors.innerHTML = await this.supabase.currentVisitors()

        // set todayVisitors
        const todayVisitors = document.getElementById('todayVisitors')!
        start = DateTime.now().startOf('day').toMillis()
        stop = DateTime.now().toMillis()
        todayVisitors.innerHTML = await this.supabase.countData(start, stop)

        // set monthVisitors
        const monthVisitors = document.getElementById('monthVisitors')!
        start = DateTime.now().startOf('month').toMillis()
        stop = DateTime.now().toMillis()
        monthVisitors.innerHTML = await this.supabase.countData(start, stop)

        // set yearVisitors
        const yearVisitors = document.getElementById('yearVisitors')!
        start = DateTime.now().startOf('year').toMillis()
        stop = DateTime.now().toMillis()
        yearVisitors.innerHTML = await this.supabase.countData(start, stop)

        // set nightOwls
        const nightOwls = document.getElementById('nightOwls')!
        start = DateTime.now().startOf('year').toMillis()
        stop = DateTime.now().toMillis()
        nightOwls.innerHTML = await this.supabase.countNightOwls(start, stop)

    }

    updateChart = () => {
        const start = DateTime.now().plus({ weeks: -1, days: 1 }).startOf('day').toMillis()
        const stop = DateTime.now().toMillis()

        this.supabase.getData(start, stop).then((r: any) => this.chart.updateChart(r))
    }

    constructor(locInput: string) {
        this.loc = locInput

        if (locInput in this.colours) {
            this.colour = this.colours[locInput]
        } else {
            this.colour = this.colours['any']
        }

        // Connect to database
        this.supabase = new Database(locInput)

        // update all static elements
        this.setStaticElements()

        // update all variable elements
        this.updateVariableElements()

        // subscribe to changes. If change, update all variable elements
        this.subscribe = this.supabase.subscribe(() => {
            this.updateVariableElements()
            this.updateChart()
        })

        // Create chart
        this.chart = new Chart('chart', this.colour)

        // Update chart
        this.updateChart()


    }

}