const Attendance = require('../models/Attendance');

exports.clockIn = async (req, res) => {
  const userId = req.user.id;
  try {
    // Check if already clocked in
    const activeLog = await Attendance.findOne({ user: userId, clockOut: null });
    if (activeLog) {
      return res.status(400).json({ msg: 'Already clocked in' });
    }

    const log = new Attendance({
      user: userId,
      clockIn: new Date()
    });

    await log.save();
    res.status(201).json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.clockOut = async (req, res) => {
  const userId = req.user.id;
  try {
    const activeLog = await Attendance.findOne({ user: userId, clockOut: null });
    if (!activeLog) {
      return res.status(400).json({ msg: 'Not clocked in yet' });
    }

    activeLog.clockOut = new Date();
    
    // Calculate difference in decimal hours
    const diffMs = activeLog.clockOut - activeLog.clockIn;
    const hours = diffMs / (1000 * 60 * 60);
    activeLog.workHours = Math.round(hours * 100) / 100; // Round to 2 decimals

    await activeLog.save();
    res.json(activeLog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const logs = await Attendance.find({ user: req.user.id }).sort({ clockIn: -1 });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const activeLog = await Attendance.findOne({ user: req.user.id, clockOut: null });
    res.json({ clockedIn: !!activeLog, activeLog });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};
