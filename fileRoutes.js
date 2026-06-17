const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const auth = require('../middlewares/auth');
const upload = require('../config/upload');

router.use(auth);

router.post('/upload', upload.single('file'), fileController.uploadFile);
router.get('/project/:projectId', fileController.getProjectFiles);
router.get('/task/:taskId', fileController.getTaskFiles);
router.delete('/:fileId', fileController.deleteFile);

module.exports = router;
