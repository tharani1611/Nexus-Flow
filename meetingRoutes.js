const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const auth = require('../middlewares/auth');

router.use(auth);

router.post('/workspace/:workspaceId', meetingController.createMeeting);
router.get('/workspace/:workspaceId', meetingController.getWorkspaceMeetings);
router.post('/:meetingId/join', meetingController.joinMeeting);
router.post('/:meetingId/end', meetingController.endMeeting);

module.exports = router;
