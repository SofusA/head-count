import sqlite3 from 'sqlite3'

let init_db = () => {
    let db = new sqlite3.Database('database.db')

    db.run("CREATE TABLE IF NOT EXISTS counterTable (time INTEGER PRIMARY KEY, door TEXT NOT NULL, direction_in INTEGER DEFAULT 0, direction_out INTEGER DEFAULT 0)");
    db.run('DROP TABLE IF EXISTS sensorList')
    db.run("CREATE TABLE IF NOT EXISTS sensorList (sensor TEXT NOT NULL PRIMARY KEY, error TEXT, heartbeat TEXT, lastMsg TEXT)");

    db.close()
}

export {init_db}