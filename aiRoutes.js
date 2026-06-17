const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middlewares/auth');

router.use(auth);

router.post('/description', aiController.generateDescription);
router.post('/priority', aiController.suggestPriority);
router.post('/estimate', aiController.estimateTime);
router.post('/sprint-plan', aiController.suggestSprint);

module.exports = router;
