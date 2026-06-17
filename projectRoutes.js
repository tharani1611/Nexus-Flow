const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');
const { validateProject } = require('../middlewares/validation');

// All project routes are protected
router.use(auth);

// Workspace specific project list and creation
router.post('/workspace/:workspaceId', roles(['Super Admin', 'Admin', 'Manager', 'Team Lead']), validateProject, projectController.createProject);
router.get('/workspace/:workspaceId', roles(), projectController.getWorkspaceProjects);

// Project specific routes
router.get('/:projectId', projectController.getProjectDetails);
router.put('/:projectId', projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);
router.post('/:projectId/archive', projectController.archiveProject);
router.post('/:projectId/duplicate', projectController.duplicateProject);
router.post('/:projectId/clone', projectController.cloneProject);

module.exports = router;
