import express from 'express';
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Connect to supabase
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://flpcdxxaexyriudizhty.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyNjQyNzkyOCwiZXhwIjoxOTQyMDAzOTI4fQ.XoT5qhcfNYapF_rDJxzokPX9eOGCB0hzBW5crHvcnoA'
const supabase = createClient(supabaseUrl, supabaseKey)

async function addNew(count: Object) {

  const msgOut = {
    door: count['channel_name'],
    time: new Date(count['event_time']).getTime(),
    ...(count['rule_name'] == "Enter" && { "direction_in": 1 }),
    ...(count['rule_name'] == "Exit" && { "direction_out": 1 }),
    location: count['channel_name'].split(';')[0]
  };

  console.log(msgOut)

  // // console.log(`New measurement:  ${count['channel_name']} → ${count['rule_name']}`)

  let { data, error } = await supabase.from('counter').insert([
    msgOut
  ])
  return 'data'
}

app.get('/', (req, res) => {
  res.send(`Hello`);
});

app.post('/count', (req, res) => {
  // parse and put to database
  addNew(req.body).then((data) => {
    // console.log('New count')
  })
  // console.log('New post')

  // Update sensorlist
  // updateSensor(count)

  // Invoke update to front-ends
  // counter.iot-lab.dk/update
  // Send: room that needs to be updated

  // respond
  res.send({
    response: 'OK'
  });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Count API: listening on port ${port}`);
});
