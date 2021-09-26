import sqlite3 from 'sqlite3'
let db = new sqlite3.Database('database.db')

import { DateTime } from 'luxon'

const getFirstVisitor = (location: string) => {
    return new Promise((resolve, reject) => {
        const three = DateTime.now().startOf('day').plus({hour: 3}).toMillis()
        const query = 'SELECT time from counterTable WHERE instr(door, "' + location + '") AND time > ' + three + ' ORDER BY time ASC LIMIT 1'

        db.all(query, function (err, rows) {
            resolve(rows[0]['time'])
        })
    })
}

let resetTimeObject = {}

function sameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

const getCurrentVisitors = (location: string) => {
    return new Promise((resolve, reject) => {

        // Handle the reset timer
        const now = new Date();
        let resetTime = new Date()

        // If resetTimer exists. Define it
        if (resetTimeObject[location]) {
            resetTime = resetTimeObject[location]
        } else { // Otherwise set to today at 03. Only run once every server reset
            resetTime.setHours(3, 0, 0, 0)
            resetTimeObject[location] = resetTime;
        }

        // If resetTimer has not been reset today, and the time is more than 03, reset to today at 03 and store the timer
        if (!sameDay(now, resetTime) && now.getHours() > 3) {
            resetTime = now
            resetTime.setHours(3, 0, 0, 0);
            resetTimeObject[location] = resetTime;
            console.log('New day: resetTimer is reset for: ' + location)
        }

        const query = 'SELECT SUM(direction_in)-SUM(direction_out) from counterTable WHERE instr(door, "' + location + '") > 0 AND time > ' + resetTime.getTime()

        getQuery(query, 'SUM(direction_in)-SUM(direction_out)').then(r => {
            if (r < 0) {
                resetTime = now
                resetTimeObject[location] = resetTime;
                console.log('resetTime was reset, due to below 0 visitors. Measured value was: ' + r + '. New reset time: ' + resetTime)
                resolve(0)
            } else {
                resolve(r)
            }
            // resolve((r > 0) ? r : 0) // return 0 if below 0
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
