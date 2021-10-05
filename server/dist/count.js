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
exports.getCounts = exports.parseCount = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
let db = new sqlite3_1.default.Database('database.db');
let parseCount = (input) => {
    const msgOut = Object.assign(Object.assign({ "door": "\'" + input['channel_name'] + "\'", "time": new Date(input['event_time']).getTime() }, (input['rule_name'] == "Enter" && { "direction_in": 1 })), (input['rule_name'] == "Exit" && { "direction_out": 1 }));
    sendToDatabase(msgOut);
    msgOut['location'] = input['channel_name'].split(';')[0];
    console.log('New measurement: ' + input['channel_name'] + ' → ' + input['rule_name']);
    return msgOut;
};
exports.parseCount = parseCount;
let sendToDatabase = (input) => {
    const query = "INSERT INTO counterTable(" + Object.keys(input) + ") VALUES(" + Object.values(input) + ")";
    db.run(query);
};
let getCountsInternal = (location, start, stop, all) => {
    return new Promise((resolve, reject) => {
        let query = `SELECT * from counterTable WHERE instr(door, "${location}") AND time > ${start} and time < ${stop}`;
        if (!all) {
            query = query.concat(' and direction_in = 1');
        }
        getQuery(query).then(r => resolve(r));
    });
};
const getCounts = (location, start, stop, all = false) => __awaiter(void 0, void 0, void 0, function* () {
    const out = yield getCountsInternal(location, start, stop, all);
    return out;
});
exports.getCounts = getCounts;
const getQuery = (query) => {
    return new Promise((resolve, reject) => {
        db.all(query, function (err, rows) {
            resolve(rows);
        });
    });
};
//# sourceMappingURL=count.js.map