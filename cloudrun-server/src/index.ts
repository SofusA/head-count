import express from 'express';
import path from 'path'
import helmet from 'helmet';

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// helmet stuff
// app.use(helmet.contentSecurityPolicy({
//   directives: {
//     defaultSrc: ["'self'", "'unsafe-inline'", 'localhost', '*.supabase.co', '*.jsdelivr.net', 'unpkg.com'],
//     scriptSrc: ["'self'", "'unsafe-inline'", 'localhost', '*.supabase.co', '*.jsdelivr.net', 'unpkg.com'],
//     styleSrc: ["'self'", "'unsafe-inline'", 'localhost', '*.supabase.co', '*.jsdelivr.net'],
//   }
// }));

// Connect to supabase
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://flpcdxxaexyriudizhty.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjI2NDI3OTI4LCJleHAiOjE5NDIwMDM5Mjh9.33X_sXHlwGoyerrKU-CXeY37eb7oAG0krYOQc28qTXw'
const supabase = createClient(supabaseUrl, supabaseKey)

app.get('/', (req, res) => {
  res.send(`Hello`);
});

app.use(express.static(path.join(__dirname, 'static')))

app.post('/count', (req, res) => {
  // parse and put to database
  addNew(req.body).then((r) => {
    console.log(r)
  })

  updateSensorList(req.body).then((r) => {
    console.log(r)
  })

  // respond
  res.send({
    response: 'OK'
  });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Count API: listening on port ${port}`);
});

const updateSensorList = async (count: Object) => {
  const parsedCount = parseCount(count)

  const { data, error } = await supabase
    .from('sensor').upsert([{ door: parsedCount.door, lastMsg: parsedCount.time }])

  if (error) { return error }
  return data
}

const addNew = async (count: Object) => {
  let { data, error } = await supabase.from('counter').insert([
    parseCount(count)
  ])

  if (error) { return error }
  return data
}

const parseCount = (count: Object) => {
  const msgOut = {
    door: count['channel_name'],
    time: new Date(count['event_time']).getTime(),
    ...(count['rule_name'] == "Enter" && { "direction_in": 1 }),
    ...(count['rule_name'] == "Exit" && { "direction_out": 1 }),
    location: count['channel_name'].split(';')[0]
  };

  return msgOut
}