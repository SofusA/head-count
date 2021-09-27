import sqlite3 from 'sqlite3'
let db = new sqlite3.Database('database.db')

import { DateTime } from 'luxon'

const getFirstVisitor = (location: string) => {
    return new Promise((resolve, reject) => {
        const three = DateTime.now().startOf('day').plus({ hour: 3 }).toMillis()
        const query = 'SELECT time from counterTable WHERE instr(door, "' + location + '") AND time > ' + three + ' ORDER BY time ASC LIMIT 1'

        db.all(query, function (err, rows) {
            resolve(rows[0]['time'])
        })
    })
}

const getCurrentVisitors = (location: string) => {
    return new Promise((resolve, reject) => {
        let time = 0
        // if it is between 24 and 03
        if (DateTime.now().toFormat('H') > 0 && DateTime.now().toFormat('H') < 3) {
            time = DateTime.now().plus({ days: -1 }).startOf('day').plus({ hour: 3 }).toMillis()
        } else {
            time = DateTime.now().startOf('day').plus({ hour: 3 }).toMillis()
        }


        const query = `SELECT * from counterTable WHERE instr(door, "${location}") AND time > ${time}`
        db.all(query, function (err, rows) {
            let visitors = 0
            for (const count of rows) {
                visitors = visitors + count.direction_in - count.direction_out
                if (visitors < 0) { visitors = 0 }
            }

            resolve(visitors)
        })
    })
}

const getTodayVisitors = (location: string) => {
    return new Promise((resolve, reject) => {
        const today = DateTime.now().startOf('day').toMillis()
        const query = 'SELECT SUM(direction_in) from counterTable WHERE instr(door, "' + location + '") > 0 AND time > ' + today

        getQuery(query, 'SUM(direction_in)').then(r => resolve(r))
    })
}

const getWeekVisitors = (location: string) => {
    return new Promise((resolve, reject) => {
        const firstday = DateTime.now().startOf('week')
        const lastday = DateTime.now().endOf('week')

        const query = 'SELECT SUM(direction_in) from counterTable WHERE instr(door, "' + location + '") > 0 AND time > ' + firstday + ' AND time < ' + lastday
        getQuery(query, 'SUM(direction_in)').then(r => resolve(r))
    })
}

const getMonthVisitors = (location: string) => {
    return new Promise((resolve, reject) => {
        const firstday = DateTime.now().startOf('month')
        const lastday = DateTime.now().endOf('month')

        const query = 'SELECT SUM(direction_in) from counterTable WHERE instr(door, "' + location + '") > 0 AND time > ' + firstday + ' AND time < ' + lastday
        getQuery(query, 'SUM(direction_in)').then(r => resolve(r))
    })
}

const getYearVisitors = (location: string) => {
    return new Promise((resolve, reject) => {
        const firstday = DateTime.now().startOf('year')
        const lastday = DateTime.now().endOf('year')

        const query = 'SELECT SUM(direction_in) from counterTable WHERE instr(door, "' + location + '") > 0 AND time > ' + firstday + ' AND time < ' + lastday
        getQuery(query, 'SUM(direction_in)').then(r => resolve(r))
    })
}

const getTotalVisitors = (location: string) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT SUM(direction_in) from counterTable WHERE instr(door, "' + location + '") > 0'
        getQuery(query, 'SUM(direction_in)').then(r => resolve(r))
    })
}

const buildIntervalQuery = (location: string) => {
    const interval = [{ start: 0, end: 12 }, { start: 12, end: 17 }, { start: 17, end: 24 }]

    const start = new Date();
    const end = new Date();

    // Build query
    let query = [];
    for (const timeslot of interval) {
        0
        end.setHours(timeslot.end, 0, 0, 0);
        start.setHours(timeslot.start, 0, 0, 0);
        query.push('SELECT SUM(direction_in) from counterTable WHERE instr(door, "' + location + '") > 0 AND time > ' + start.getTime() + ' AND time < ' + end.getTime());
    }

    return query
}

const getQuery = (query: string, output: string) => {
    return new Promise((resolve, reject) => {
        db.each(query, function (err, rows) {
            resolve(rows[output])
        })
    })
}


const frontPage = async (location: string) => {
    console.log('Frontpage data fetched for: ' + location)
    const out = {
        firstVisitor: await getFirstVisitor(location) || 0,
        todayVisitors: await getTodayVisitors(location) || 0,
        todayMorning: await getQuery(buildIntervalQuery(location)[0], 'SUM(direction_in)') || 0,
        todayAfternoon: await getQuery(buildIntervalQuery(location)[1], 'SUM(direction_in)') || 0,
        todayNight: await getQuery(buildIntervalQuery(location)[2], 'SUM(direction_in)') || 0,
        weekVisitors: await getWeekVisitors(location) || 0,
        monthVisitors: await getMonthVisitors(location) || 0,
        yearVisitors: await getYearVisitors(location) || 0,
        totalVisitors: await getTotalVisitors(location) || 0,
        currentVisitors: await getCurrentVisitors(location) || 0,
    }
    return out;
}

export { frontPage }
