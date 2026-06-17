const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middlewares/auth');

router.use(auth);

router.get('/workspace/:workspaceId', chatController.getWorkspaceMessages);
router.get('/project/:projectId', chatController.getProjectMessages);
router.get('/direct/:recipientId', chatController.getDirectMessages);

module.exports = router;
