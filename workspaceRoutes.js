const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspaceController');
const auth = require('../middlewares/auth');
const roles = require('../middlewares/roles');
const { validateWorkspace } = require('../middlewares/validation');

// All workspace routes are protected
router.use(auth);

router.post('/', validateWorkspace, workspaceController.createWorkspace);
router.get('/', workspaceController.getUserWorkspaces);
router.get('/:workspaceId', roles(), workspaceController.getWorkspaceDetails);
router.put('/:workspaceId', roles(['Super Admin', 'Admin']), validateWorkspace, workspaceController.updateWorkspace);
router.delete('/:workspaceId', roles(['Super Admin']), workspaceController.deleteWorkspace);

router.post('/:workspaceId/invite', roles(['Super Admin', 'Admin', 'Manager']), workspaceController.inviteUser);
router.post('/:workspaceId/remove', roles(['Super Admin', 'Admin', 'Manager']), workspaceController.removeUser);
router.post('/:workspaceId/leave', roles(), workspaceController.leaveWorkspace);

module.exports = router;
