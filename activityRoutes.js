const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const auth = require('../middlewares/auth');

router.use(auth);

router.get('/workspace/:workspaceId', activityController.getWorkspaceActivities);

module.exports = router;
