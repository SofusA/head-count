import express from 'express'
let router = express.Router()
import { DateTime } from "luxon";

// Connect to supabase
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://flpcdxxaexyriudizhty.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjI2NDI3OTI4LCJleHAiOjE5NDIwMDM5Mjh9.33X_sXHlwGoyerrKU-CXeY37eb7oAG0krYOQc28qTXw'
const supabase = createClient(supabaseUrl, supabaseKey)

router.post('/', (req, res) => {
    try {
        // Put into to database
        addNew(req.body).then((r) => {
            console.log(r)
        })

        // Also update sensorlist
        updateSensorList(req.body).then((r) => {
            console.log(r)
        })

        // respond
        res.send({
            response: 'OK'
        });
        
    } catch (error) {
        res.status(400).send(new Error('Error'))
    }
    
});


const updateSensorList = async (count: Object) => {
    const parsedCount = parseCount(count)

    const { data, error } = await supabase
        .from('sensor').upsert([{ door: parsedCount.door, lastMsg: parsedCount.time }])

    if (error) { throw error }
    return data
}

const addNew = async (count: Object) => {
    let { data, error } = await supabase.from('counter').insert([
        parseCount(count)
    ])

    if (error) { return error }
    return data
}

const parseCount = (count: any) => {
    const time = new Date(count['event_time']).getTime()

    // Check nightowl measurement
    const measurementTime = parseInt(DateTime.fromMillis(time).toFormat('H'))
    const hourStart = 21
    const hourStop = 6

    let nightOwl = false
    if (measurementTime >= hourStart || measurementTime <= hourStop) {
        nightOwl = true
    }

    // Construct payload
    const msgOut = {
        door: count['channel_name'],
        time: time,
        ...(count['rule_name'] == "Enter" && { "direction_in": 1 }),
        ...(count['rule_name'] == "Exit" && { "direction_out": 1 }),
        ...(nightOwl && { "nightowl": true }),
        location: count['channel_name'].split(';')[0]
    };

    return msgOut
}

export { router }