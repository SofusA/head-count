import express from 'express'
let router = express.Router()
import path from 'path'

router.get('/', (req, res) => {
    res.send(`Hi`);
});

// dashboard
router.get('/:loc', (req, res) => {
    res.sendFile(path.join(__dirname, '../static/dashboard.html'));
});

// status
router.get('/:loc/status', (req, res) => {
    res.sendFile(path.join(__dirname, '../static/status.html'));
});

//monitor
router.get('/:loc/monitor', (req, res) => {
    res.sendFile(path.join(__dirname, '../static/monitor.html'));
});

//export
router.get('/:loc/export', (req, res) => {
    res.sendFile(path.join(__dirname, '../static/export.html'));
});


export { router }