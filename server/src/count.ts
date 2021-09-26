import sqlite3 from 'sqlite3'
let db = new sqlite3.Database('database.db')

let parseCount = (input: string) => {
    const msgOut = {
        "door": "\'" + input['channel_name'] + "\'",
        "time": new Date(input['event_time']).getTime(),
        ...(input['rule_name'] == "Enter" && { "direction_in": 1 }),
        ...(input['rule_name'] == "Exit" && { "direction_out": 1 })
    };

    sendToDatabase(msgOut);
    msgOut['location'] = input['channel_name'].split(';')[0]

    console.log('New measurement: ' + input['channel_name'] + ' → ' + input['rule_name'])
    return msgOut;
}

let sendToDatabase = (input: object) => {
    const query = "INSERT INTO counterTable(" + Object.keys(input) + ") VALUES(" + Object.values(input) + ")"
    db.run(query)
}

let getCountsInternal = (location: string, start: string, stop: string) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * from counterTable WHERE instr(door, "${location}") AND time > ${start} and time < ${stop}`
        getQuery(query).then(r => resolve(r))
    })
}

const getCounts = async (location: string, start: string, stop: string) => {
    const out = await getCountsInternal(location, start, stop)
    return out;
}

const getQuery = (query: string) => {
    return new Promise((resolve, reject) => {
        db.all(query, function (err, rows) {
            resolve(rows)
        })
    })
}


export { parseCount, getCounts }

