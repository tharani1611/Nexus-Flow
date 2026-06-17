const express = require('express');
const router = express.Router();
const sprintController = require('../controllers/sprintController');
const auth = require('../middlewares/auth');

// All sprint routes are protected
router.use(auth);

router.post('/project/:projectId', sprintController.createSprint);
router.get('/project/:projectId', sprintController.getProjectSprints);
router.post('/:sprintId/start', sprintController.startSprint);
router.post('/:sprintId/complete', sprintController.completeSprint);
router.put('/:sprintId', sprintController.updateSprint);
router.delete('/:sprintId', sprintController.deleteSprint);

module.exports = router;
