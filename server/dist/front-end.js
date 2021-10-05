"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.frontPage = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
let db = new sqlite3_1.default.Database('database.db');
const luxon_1 = require("luxon");
const getFirstVisitor = (location) => {
    return new Promise((resolve, reject) => {
        const three = luxon_1.DateTime.now().startOf('day').plus({ hour: 3 }).toMillis();
        const query = 'SELECT time from counterTable WHERE instr(door, "' + location + '") AND time > ' + three + ' ORDER BY time ASC LIMIT 1';
        db.all(query, function (err, rows) {
            if (rows[0]) {
                resolve(rows[0]['time']);
            }
            else {
                resolve(0);
            }
        });
    });
};
const getCurrentVisitors = (location) => {
    return new Promise((resolve, reject) => {
        let time = 0;
        // if it is between 24 and 03
        if (luxon_1.DateTime.now().toFormat('H') > 0 && luxon_1.DateTime.now().toFormat('H') < 3) {
            time = luxon_1.DateTime.now().plus({ days: -1 }).startOf('day').plus({ hour: 3 }).toMillis();
        }
        else {
            time = luxon_1.DateTime.now().startOf('day').plus({ hour: 3 }).toMillis();
        }
        const query = `SELECT * from counterTable WHERE instr(door, "${location}") AND time > ${time}`;
        db.all(query, function (err, rows) {
            let visitors = 0;
            for (const count of rows) {
                visitors = visitors + count.direction_in - count.direction_out;
                if (visitors < 0) {
                    visitors = 0;
                }
            }
            resolve(visitors);
        });
    });
};
const getTodayVisitors = (location) => {
    return new Promise((resolve, reject) => {
        const today = luxon_1.DateTime.now().startOf('day').toMillis();
        const query = 'SELECT SUM(direction_in) from counterTable WHERE instr(door, "' + location + '") > 0 AND time > ' + today;
        getQuery(query, 'SUM(direction_in)').then(r => resolve(r));
    });
};
const getWeekVisitors = (location) => {
    return new Promise((resolve, reject) => {
        const firstday = luxon_1.DateTime.now().startOf('week');
        const lastday = luxon_1.DateTime.now().endOf('week');
        const query = 'SELECT SUM(direction_in) from counterTable WHERE instr(door, "' + location + '") > 0 AND time > ' + firstday + ' AND time < ' + lastday;
        getQuery(query, 'SUM(direction_in)').then(r => resolve(r));
    });
};
const getMonthVisitors = (location) => {
    return new Promise((resolve, reject) => {
        const firstday = luxon_1.DateTime.now().startOf('month');
        const lastday = luxon_1.DateTime.now().endOf('month');
        const query = 'SELECT SUM(direction_in) from counterTable WHERE instr(door, "' + location + '") > 0 AND time > ' + firstday + ' AND time < ' + lastday;
        getQuery(query, 'SUM(direction_in)').then(r => resolve(r));
    });
};
const getYearVisitors = (location) => {
    return new Promise((resolve, reject) => {
        const firstday = luxon_1.DateTime.now().startOf('year');
        const lastday = luxon_1.DateTime.now().endOf('year');
        const query = 'SELECT SUM(direction_in) from counterTable WHERE instr(door, "' + location + '") > 0 AND time > ' + firstday + ' AND time < ' + lastday;
        getQuery(query, 'SUM(direction_in)').then(r => resolve(r));
    });
};
const getTotalVisitors = (location) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT SUM(direction_in) from counterTable WHERE instr(door, "' + location + '") > 0';
        getQuery(query, 'SUM(direction_in)').then(r => resolve(r));
    });
};
const buildIntervalQuery = (location) => {
    const interval = [{ start: 0, end: 12 }, { start: 12, end: 17 }, { start: 17, end: 24 }];
    const start = new Date();
    const end = new Date();
    // Build query
    let query = [];
    for (const timeslot of interval) {
        0;
        end.setHours(timeslot.end, 0, 0, 0);
        start.setHours(timeslot.start, 0, 0, 0);
        query.push('SELECT SUM(direction_in) from counterTable WHERE instr(door, "' + location + '") > 0 AND time > ' + start.getTime() + ' AND time < ' + end.getTime());
    }
    return query;
};
const getQuery = (query, output) => {
    return new Promise((resolve, reject) => {
        db.each(query, function (err, rows) {
            resolve(rows[output]);
        });
    });
};
const frontPage = (location) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Frontpage data fetched for: ' + location);
    const out = {
        firstVisitor: (yield getFirstVisitor(location)) || 0,
        todayVisitors: (yield getTodayVisitors(location)) || 0,
        todayMorning: (yield getQuery(buildIntervalQuery(location)[0], 'SUM(direction_in)')) || 0,
        todayAfternoon: (yield getQuery(buildIntervalQuery(location)[1], 'SUM(direction_in)')) || 0,
        todayNight: (yield getQuery(buildIntervalQuery(location)[2], 'SUM(direction_in)')) || 0,
        weekVisitors: (yield getWeekVisitors(location)) || 0,
        monthVisitors: (yield getMonthVisitors(location)) || 0,
        yearVisitors: (yield getYearVisitors(location)) || 0,
        totalVisitors: (yield getTotalVisitors(location)) || 0,
        currentVisitors: (yield getCurrentVisitors(location)) || 0,
    };
    return out;
});
exports.frontPage = frontPage;
//# sourceMappingURL=front-end.js.map