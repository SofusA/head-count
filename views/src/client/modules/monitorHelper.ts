import { DateTime } from 'luxon'
import { Database } from './database'

export class Monitor {
    private supabase: any
    private subscribe: any
    private loc: string

    private updateVariableElements = async () => {
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

        // set weekVisitors
        const weekVisitors = document.getElementById('weekVisitors')!
        start = DateTime.now().startOf('week').toMillis()
        stop = DateTime.now().toMillis()
        weekVisitors.innerHTML = await this.supabase.countData(start, stop)

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

        // set totalVisitors
        const totalVisitors = document.getElementById('totalVisitors')!
        start = 0
        stop = DateTime.now().toMillis()
        totalVisitors.innerHTML = await this.supabase.countData(start, stop)

        // set nightOwls
        const nightOwls = document.getElementById('nightOwls')!
        start = DateTime.now().startOf('year').toMillis()
        stop = DateTime.now().toMillis()
        nightOwls.innerHTML = await this.supabase.countNightOwls(start, stop)
    }

    constructor(locInput: string) {
        this.loc = locInput

        // Connect to database
        this.supabase = new Database(locInput)

        // update all variable elements
        this.updateVariableElements()

        // subscribe to changes. If change, update all variable elements
        this.subscribe = this.supabase.subscribe(() => this.updateVariableElements())
    }
}