"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init_db = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
let init_db = () => {
    let db = new sqlite3_1.default.Database('database.db');
    db.run("CREATE TABLE IF NOT EXISTS counterTable (time INTEGER PRIMARY KEY, door TEXT NOT NULL, direction_in INTEGER DEFAULT 0, direction_out INTEGER DEFAULT 0)");
    db.run('DROP TABLE IF EXISTS sensorList');
    db.run("CREATE TABLE IF NOT EXISTS sensorList (sensor TEXT NOT NULL PRIMARY KEY, error TEXT, heartbeat TEXT, lastMsg TEXT)");
    db.close();
};
exports.init_db = init_db;
//# sourceMappingURL=init_db.js.map