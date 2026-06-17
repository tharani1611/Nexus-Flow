const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middlewares/auth');
const { validateTask } = require('../middlewares/validation');

// Protect all routes
router.use(auth);

// CRUD
router.post('/workspace/:workspaceId', validateTask, taskController.createTask);
router.get('/project/:projectId', taskController.getProjectTasks);
router.get('/:taskId', taskController.getTaskDetails);
router.put('/:taskId', taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);
router.post('/:taskId/archive', taskController.archiveTask);
router.post('/:taskId/duplicate', taskController.duplicateTask);

// Time tracking
router.post('/:taskId/timer', taskController.toggleTimer);

// Subtasks
router.post('/:taskId/subtasks', taskController.createSubtask);
router.put('/subtasks/:subtaskId', taskController.updateSubtaskStatus);
router.delete('/subtasks/:subtaskId', taskController.deleteSubtask);

// Checklists
router.post('/:taskId/checklists', taskController.createChecklist);
router.post('/checklists/:checklistId/items', taskController.addChecklistItem);
router.put('/checklists/:checklistId/items/:itemId/toggle', taskController.toggleChecklistItem);
router.delete('/checklists/:checklistId', taskController.deleteChecklist);

// Comments
router.post('/:taskId/comments', taskController.addComment);
router.delete('/comments/:commentId', taskController.deleteComment);

module.exports = router;
