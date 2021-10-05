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
exports.statusPage = exports.updateSensor = exports.updateError = exports.updateHeartbeat = void 0;
let errorLog = {};
const sqlite3_1 = __importDefault(require("sqlite3"));
let db = new sqlite3_1.default.Database('database.db');
let updateHeartbeat = (input) => {
    console.log(input);
    let door = input['door'].replace(/['"]+/g, '');
    door = door.split(';')[0] + ';' + door.split(';')[1];
    // const query = 'UPDATE sensorList SET heartbeat = ' + new Date().getTime() + ' WHERE instr(sensor, "' + input['door'].replace(/['"]+/g, '') + '")'
    const query = 'REPLACE INTO sensorList (sensor, heartbeat, lastMsg) VALUES ("' + door + '", ' + new Date().getTime() + ', (SELECT lastMsg FROM sensorList WHERE sensor = "' + door + '"))';
    console.log('New heartbeat: ' + input['door']);
    db.run(query);
};
exports.updateHeartbeat = updateHeartbeat;
let updateError = (input) => {
    const error = {
        time: new Date().getTime(),
        door: input['channel_name'],
        event: input['event_name']
    };
    errorLog[error.door] = error;
};
exports.updateError = updateError;
let updateSensor = (input) => {
    let door = input['door'].replace(/['"]+/g, '');
    door = door.split(';')[0] + ';' + door.split(';')[1];
    // const query = 'UPDATE sensorList set lastMsg = ' + input['time'] + ' WHERE instr(sensor, "' + input['door'].replace(/['"]+/g, '') + '")'
    const query = 'REPLACE INTO sensorList (sensor, lastMsg, heartbeat) VALUES ("' + door + '", ' + new Date().getTime() + ', (SELECT heartbeat FROM sensorList WHERE sensor = "' + door + '"))';
    db.run(query);
};
exports.updateSensor = updateSensor;
let getSensorList = () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * from sensorList', function (err, rows) {
            resolve(rows);
        });
    });
};
const statusPage = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield getSensorList();
});
exports.statusPage = statusPage;
//# sourceMappingURL=maintenance.js.map