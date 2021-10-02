import axios from 'axios'

const server = 'http://127.0.0.1:8080/count'

let sendOneCount = () => {
    const time = new Date()
    const count = {
        "channel_id": "f590d746-0a72-43e4-beb7-6fa04f978121",
        "channel_name": "test;location;door",
        "event_name": "Crossed line",
        "event_origin": "Pedestrian",
        "event_time": time.getTime(),
        "event_type": "TripwireCrossed",
        "object_id": 677,
        "rule_id": "974c8bc3-c3be-4698-83ae-720c718df09a",
        "rule_name": "null"
    }

    if (Math.random() < 0.5) {
        count["rule_name"] = "Exit"
    } else {
        count["rule_name"] = "Enter"
    }

    if (Math.random() < 0.5) {
        count["channel_name"] = "test;loc;door1"
    } else {
        count["channel_name"] = "test;loc;door2"
    }


    return count;
};

let sendOne = async () => {
    axios.post(server, sendOneCount())
        .then(function (response) {
            console.log("Success");
        })
        .catch(function (error) {
            console.log("Error");
        });
}

let sendHeatbeat = async () => {
    let sensor:string
    if (Math.random() < 0.5) {
        sensor = "test;loc;door1"
    } else {
        sensor = "test;loc;door2"
    }

    axios.post('https://counter.iot-lab.dk/heartbeat', {door:sensor})
    .then(function (response) {
        console.log("Success");
    })
    .catch(function (error) {
        console.log("Error");
    });

}

console.log("Sending 10 counts in a row")
for (let i = 0; i<10; i++){
    sendOne()
    console.log(`Sending: ${i}`)
}

// setInterval(sendOne, 5000)
// setInterval(sendHeatbeat, 30000)