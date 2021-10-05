"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Set up server
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
// Https stuff
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
var credentials = {
    key: fs_1.default.readFileSync('/etc/letsencrypt/live/counter.iot-lab.dk/privkey.pem', 'utf8'),
    cert: fs_1.default.readFileSync('/etc/letsencrypt/live/counter.iot-lab.dk/fullchain.pem', 'utf8'),
    ca: fs_1.default.readFileSync('/etc/letsencrypt/live/counter.iot-lab.dk/chain.pem', 'utf8')
};
// var credentials = {
//   key: fs.readFileSync('/home/sofusa/certs/counter.iot-lab.dk/privkey.pem', 'utf8'),
//   cert: fs.readFileSync('/home/sofusa/certs/counter.iot-lab.dk/fullchain.pem', 'utf8'),
//   // ca: fs.readFileSync('/var/home/sofusa/certs/counter.iot-lab.dk/chain.pem', 'utf8')
// };
var app = (0, express_1.default)();
var httpsServer = https_1.default.createServer(credentials, app);
var httpServer = http_1.default.createServer(app);
httpsServer.listen(443);
httpServer.listen(880);
// Redirect to https
function requireHTTPS(req, res, next) {
    // The 'x-forwarded-proto' check is for Heroku
    if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV !== "development") {
        return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
}
app.use(requireHTTPS);
const socket_io_1 = require("socket.io");
const io = new socket_io_1.Server(httpsServer);
// app.use(helmet());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static(path_1.default.join(__dirname, 'static'), { dotfiles: 'allow' }));
// Import api handlers
const count_1 = require("./count");
const maintenance_1 = require("./maintenance");
const init_db_1 = require("./init_db");
const front_end_1 = require("./front-end");
// http.listen(port, () => {
//   console.log(`Socket.IO server running at http://localhost:${port}/`);
// });
// serve Skylab
app.get('/skylab', (req, res) => {
    res.sendFile(__dirname + '/client/skylab.html');
});
// serve ITU
app.get('/itu', (req, res) => {
    res.sendFile(__dirname + '/client/itu.html');
});
// serve export
app.get('/export/:loc', (req, res) => {
    res.sendFile(__dirname + '/client/export.html');
});
// serve export API
app.get('/api/export/:location/start/:start/stop/:stop', (req, res) => {
    (0, count_1.getCounts)(req.params.location, req.params.start, req.params.stop).then((result) => {
        res.send(result);
    });
});
// serve export API with ALL
app.get('/api/export/:location/start/:start/stop/:stop/all', (req, res) => {
    (0, count_1.getCounts)(req.params.location, req.params.start, req.params.stop, true).then((result) => {
        res.send(result);
    });
});
// serve novonordisk
app.get('/novonordisk', (req, res) => {
    res.sendFile(__dirname + '/client/novonordisk.html');
});
app.get('/init', (req, res) => {
    (0, init_db_1.init_db)();
    res.send({
        response: 'OK'
    });
});
// subscribe new connections
io.on('connection', (socket) => {
    socket.on('join', (r) => {
        const site = r.split('/')[0];
        const location = r.split('/')[1] || site;
        // console.log('New ' + site + ' : ' + location)
        socket.join(r);
        // update status connections
        if (location === 'status') {
            (0, maintenance_1.statusPage)().then((result) => {
                socket.emit('update', result);
            });
        }
        // update front-end connections
        if (site === 'front') {
            (0, front_end_1.frontPage)(location).then((result) => {
                socket.emit('update', result);
            });
        }
    });
});
// count api
app.post('/count', (req, res) => {
    // parse and put to database
    const count = (0, count_1.parseCount)(req.body);
    // Update sensorlist
    (0, maintenance_1.updateSensor)(count);
    let rooms = [...io.of("/").adapter.rooms.keys()];
    for (const room of rooms) {
        // update front-ends
        if (room.includes('front') && room.includes(count['location'])) { // Push to all 'front' rooms where this count is related to.
            (0, front_end_1.frontPage)(count['location']).then((result) => {
                io.to('front/' + count['location']).emit('update', result);
            });
        }
        // update status connections
        if (room.includes('status')) { // Push to all 'status'
            (0, maintenance_1.statusPage)().then((result) => {
                io.to('tool/status').emit('update', result);
            });
        }
    }
    // respond
    res.send({
        response: 'OK'
    });
});
// heartbeat api
app.post('/heartbeat', (req, res) => {
    (0, maintenance_1.updateHeartbeat)(req.body);
    res.send({
        response: 'OK'
    });
});
// error api
app.post('/error', (req, res) => {
    (0, maintenance_1.updateError)(req.body);
    res.send({
        response: 'OK'
    });
});
// status page
app.get('/status', (req, res) => {
    res.sendFile(__dirname + '/client/status.html');
});
//# sourceMappingURL=app.js.map