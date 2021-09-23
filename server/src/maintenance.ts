let errorLog = {}

import sqlite3 from 'sqlite3'
let db = new sqlite3.Database('database.db')

let updateHeartbeat = (input: string) => {
    console.log(input)
    let door = input['door'].replace(/['"]+/g, '')
    door = door.split(';')[0]+';'+door.split(';')[1]
    // const query = 'UPDATE sensorList SET heartbeat = ' + new Date().getTime() + ' WHERE instr(sensor, "' + input['door'].replace(/['"]+/g, '') + '")'
    const query = 'REPLACE INTO sensorList (sensor, heartbeat, lastMsg) VALUES ("' + door + '", ' + new Date().getTime() + ', (SELECT lastMsg FROM sensorList WHERE sensor = "'+ door +'"))'
    console.log('New heartbeat: ' + input['door'])
    db.run(query)
}

let updateError = (input: object) => {
    const error = {
        time: new Date().getTime(),
        door: input['channel_name'],
        event: input['event_name']
    }
    errorLog[error.door] = error
}

let updateSensor = (input: object) => {
    let door = input['door'].replace(/['"]+/g, '')
    door = door.split(';')[0]+';'+door.split(';')[1]
    // const query = 'UPDATE sensorList set lastMsg = ' + input['time'] + ' WHERE instr(sensor, "' + input['door'].replace(/['"]+/g, '') + '")'
    const query = 'REPLACE INTO sensorList (sensor, lastMsg, heartbeat) VALUES ("' + door + '", ' + new Date().getTime() + ', (SELECT heartbeat FROM sensorList WHERE sensor = "'+ door +'"))'
    db.run(query)
}


let getSensorList = () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * from sensorList', function (err, rows) {
            resolve(rows)
        })
    })
}

const statusPage = async () => {
    return await getSensorList();
}

export { updateHeartbeat, updateError, updateSensor, statusPage }
