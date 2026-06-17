const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middlewares/auth');

router.use(auth);

router.post('/workspace/:workspaceId', reportController.generateReport);
router.get('/workspace/:workspaceId', reportController.getWorkspaceReports);

module.exports = router;
