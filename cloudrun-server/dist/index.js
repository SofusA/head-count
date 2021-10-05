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
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
// helmet stuff
// app.use(helmet.contentSecurityPolicy({
//   directives: {
//     defaultSrc: ["'self'", "'unsafe-inline'", 'localhost', '*.supabase.co', '*.jsdelivr.net', 'unpkg.com'],
//     scriptSrc: ["'self'", "'unsafe-inline'", 'localhost', '*.supabase.co', '*.jsdelivr.net', 'unpkg.com'],
//     styleSrc: ["'self'", "'unsafe-inline'", 'localhost', '*.supabase.co', '*.jsdelivr.net'],
//   }
// }));
// Connect to supabase
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = 'https://flpcdxxaexyriudizhty.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjI2NDI3OTI4LCJleHAiOjE5NDIwMDM5Mjh9.33X_sXHlwGoyerrKU-CXeY37eb7oAG0krYOQc28qTXw';
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
app.get('/', (req, res) => {
    res.send(`Hello`);
});
app.use(express_1.default.static(path_1.default.join(__dirname, 'static')));
app.post('/count', (req, res) => {
    // parse and put to database
    addNew(req.body).then((r) => {
        console.log(r);
    });
    updateSensorList(req.body).then((r) => {
        console.log(r);
    });
    // respond
    res.send({
        response: 'OK'
    });
});
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Count API: listening on port ${port}`);
});
const updateSensorList = (count) => __awaiter(void 0, void 0, void 0, function* () {
    const parsedCount = parseCount(count);
    const { data, error } = yield supabase
        .from('sensor').upsert([{ door: parsedCount.door, lastMsg: parsedCount.time }]);
    if (error) {
        return error;
    }
    return data;
});
const addNew = (count) => __awaiter(void 0, void 0, void 0, function* () {
    let { data, error } = yield supabase.from('counter').insert([
        parseCount(count)
    ]);
    if (error) {
        return error;
    }
    return data;
});
const parseCount = (count) => {
    const msgOut = Object.assign(Object.assign(Object.assign({ door: count['channel_name'], time: new Date(count['event_time']).getTime() }, (count['rule_name'] == "Enter" && { "direction_in": 1 })), (count['rule_name'] == "Exit" && { "direction_out": 1 })), { location: count['channel_name'].split(';')[0] });
    return msgOut;
};
//# sourceMappingURL=index.js.map