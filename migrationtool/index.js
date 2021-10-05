let sqlite3 = require('sqlite3')
let db = new sqlite3.Database('database.db')
const { DateTime } = require("luxon");

let sb = require('@supabase/supabase-js')
const supabaseUrl = 'https://flpcdxxaexyriudizhty.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjI2NDI3OTI4LCJleHAiOjE5NDIwMDM5Mjh9.33X_sXHlwGoyerrKU-CXeY37eb7oAG0krYOQc28qTXw'
const supabase = sb.createClient(supabaseUrl, supabaseKey)


// Get from sqlite 
db.all("SELECT * from counterTable", function (err, row) {
    checkSupabase(row).then(r => console.log('Done'))
});

// Get from supabase
const checkSupabase = async (rows) => {

    // Get timestamp for last msg
    let { data: startTime, error: startTimeError } = await supabase
        .from('counter')
        .select('time')
        .order('id', { ascending: false })
        .limit(1)
        .single()

    let pushArray = []

    for (const row of rows) {
        const measurement = { time: row.time, door: row.door, direction_in: row.direction_in, direction_out: row.direction_out, location: row.door.split(';')[0] }
        // console.log(measurement)

        // Check of old measurment
        if (!measurement.door.includes(';')) {
            // console.log('Old measurement. Skipping')
            continue
        }

        // check if test measurement
        if (measurement.door.includes('test')) {
            // console.log('Test measurement. Skipping')
            continue
        }

        // check if new measurement
        if (measurement.time <= startTime.time) {
            // console.log('Not a new measurement. Skipping')
            continue
        }

        // Check nightowl measurement
        const measurementTime = parseInt(DateTime.fromMillis(row.time).toFormat('H'))
        const hourStart = 21
        const hourStop = 6

        if (measurementTime >= hourStart || measurementTime <= hourStop) {
            measurement['nightowl'] = true
            // console.log({measurementHour: measurementTime })
        }

        // console.log(`Inserting to supabase`)
        // console.log(measurement)
        pushArray.push(measurement)
    }

    console.log(`Attempting to upload to supbase: ${pushArray.length}`)
    const { data, error } = await supabase.from('counter').insert(
        pushArray
    )

    if (error) { console.log(error) }
    if (data) { console.log(data) }

    return pushArray
}


