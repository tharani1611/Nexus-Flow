const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middlewares/auth');

router.use(auth);

router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);
router.get('/logs', attendanceController.getLogs);
router.get('/status', attendanceController.getStatus);

module.exports = router;
