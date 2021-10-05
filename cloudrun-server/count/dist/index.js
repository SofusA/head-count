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
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
// Connect to supabase
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = 'https://flpcdxxaexyriudizhty.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyNjQyNzkyOCwiZXhwIjoxOTQyMDAzOTI4fQ.XoT5qhcfNYapF_rDJxzokPX9eOGCB0hzBW5crHvcnoA';
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
function addNew(count) {
    return __awaiter(this, void 0, void 0, function* () {
        const msgOut = Object.assign(Object.assign(Object.assign({ door: count['channel_name'], time: new Date(count['event_time']).getTime() }, (count['rule_name'] == "Enter" && { "direction_in": 1 })), (count['rule_name'] == "Exit" && { "direction_out": 1 })), { location: count['channel_name'].split(';')[0] });
        console.log(msgOut);
        // // console.log(`New measurement:  ${count['channel_name']} → ${count['rule_name']}`)
        let { data, error } = yield supabase.from('counter').insert([
            msgOut
        ]);
        return 'data';
    });
}
app.get('/', (req, res) => {
    res.send(`Hello`);
});
app.post('/count', (req, res) => {
    // parse and put to database
    addNew(req.body).then((data) => {
        // console.log('New count')
    });
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
//# sourceMappingURL=index.js.map