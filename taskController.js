const Task = require('../models/Task');
const Subtask = require('../models/Subtask');
const Checklist = require('../models/Checklist');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

// Reusable progress calculation helper
const calculateTaskProgress = async (taskId) => {
  const task = await Task.findById(taskId);
  if (!task) return 0;

  const subtasks = await Subtask.find({ task: taskId });
  const checklists = await Checklist.find({ task: taskId });

  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter(s => s.status === 'Completed').length;

  let totalChecklistItems = 0;
  let completedChecklistItems = 0;

  checklists.forEach(c => {
    totalChecklistItems += c.items.length;
    completedChecklistItems += c.items.filter(item => item.isCompleted).length;
  });

  const totalItems = totalSubtasks + totalChecklistItems;
  const completedItems = completedSubtasks + completedChecklistItems;

  let progress = 0;
  if (totalItems > 0) {
    progress = Math.round((completedItems / totalItems) * 100);
  } else {
    progress = task.status === 'Done' ? 100 : 0;
  }

  return progress;
};

// Activity logging helper
const logActivity = async (userId, action, entityType, entityId, workspaceId, details) => {
  try {
    const activity = new Activity({
      user: userId,
      action,
      entityType,
      entityId,
      workspace: workspaceId,
      details
    });
    await activity.save();
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

// Notification sender helper
const sendNotification = async (userId, type, title, message, link) => {
  try {
    const notification = new Notification({
      user: userId,
      type,
      title,
      message,
      link
    });
    await notification.save();
  } catch (err) {
    console.error('Failed to send notification:', err);
  }
};

exports.createTask = async (req, res) => {
  const { title, description, project, sprint, priority, status, dueDate, storyPoints, labels, assignee } = req.body;
  const { workspaceId } = req.params;
  try {
    const task = new Task({
      title,
      description,
      workspace: workspaceId,
      project,
      sprint: sprint || null,
      priority: priority || 'Medium',
      status: status || 'Todo',
      dueDate,
      storyPoints: storyPoints || 0,
      labels: labels || [],
      assignee: assignee || null,
      reporter: req.user.id
    });

    await task.save();

    await logActivity(req.user.id, 'Created Task', 'Task', task._id, workspaceId, `Created task "${title}"`);

    if (assignee) {
      await sendNotification(
        assignee,
        'Task Assigned',
        'New Task Assigned',
        `You have been assigned the task: "${title}"`,
        `#task-${task._id}`
      );
    }

    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.getProjectTasks = async (req, res) => {
  const { projectId } = req.params;
  try {
    const tasks = await Task.find({ project: projectId, isArchived: false })
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar');
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.getTaskDetails = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('project', 'name')
      .populate('sprint', 'name');

    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    const subtasks = await Subtask.find({ task: task._id });
    const checklists = await Checklist.find({ task: task._id });
    const comments = await Comment.find({ task: task._id }).populate('author', 'name email avatar');

    res.json({
      task,
      subtasks,
      checklists,
      comments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.updateTask = async (req, res) => {
  const { title, description, sprint, priority, status, dueDate, storyPoints, labels, assignee } = req.body;
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    const oldAssignee = task.assignee;
    const oldStatus = task.status;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (sprint !== undefined) task.sprint = sprint || null;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (storyPoints !== undefined) task.storyPoints = storyPoints;
    if (labels) task.labels = labels;
    if (assignee !== undefined) task.assignee = assignee || null;

    // Recalculate progress if status changes
    if (status && status !== oldStatus) {
      // Calculate progress
      const progress = await calculateTaskProgress(task._id);
      // Wait, if it has items, the calculateTaskProgress respects them.
      // If it doesn't, it will return 100 if Done, 0 otherwise, which is correct!
    }

    await task.save();

    await logActivity(
      req.user.id,
      'Updated Task',
      'Task',
      task._id,
      task.workspace,
      `Updated task "${task.title}"`
    );

    // Notify newly assigned user
    if (assignee && assignee.toString() !== (oldAssignee ? oldAssignee.toString() : '')) {
      await sendNotification(
        assignee,
        'Task Assigned',
        'Task Assigned',
        `You have been assigned to the task: "${task.title}"`,
        `#task-${task._id}`
      );
    }

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.taskId);
    await Subtask.deleteMany({ task: req.params.taskId });
    await Checklist.deleteMany({ task: req.params.taskId });
    await Comment.deleteMany({ task: req.params.taskId });

    await logActivity(
      req.user.id,
      'Deleted Task',
      'Task',
      req.params.taskId,
      task.workspace,
      `Deleted task "${task.title}"`
    );

    res.json({ msg: 'Task and all children entities deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.archiveTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    task.isArchived = !task.isArchived;
    await task.save();

    await logActivity(
      req.user.id,
      task.isArchived ? 'Archived Task' : 'Unarchived Task',
      'Task',
      task._id,
      task.workspace,
      `${task.isArchived ? 'Archived' : 'Unarchived'} task "${task.title}"`
    );

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.duplicateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    const duplicatedTask = new Task({
      title: `${task.title} (Copy)`,
      description: task.description,
      workspace: task.workspace,
      project: task.project,
      sprint: task.sprint,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      storyPoints: task.storyPoints,
      labels: task.labels,
      assignee: task.assignee,
      reporter: req.user.id
    });

    await duplicatedTask.save();

    // Copy subtasks
    const subtasks = await Subtask.find({ task: task._id });
    for (const sub of subtasks) {
      const newSub = new Subtask({
        task: duplicatedTask._id,
        title: sub.title,
        status: sub.status
      });
      await newSub.save();
    }

    // Copy checklists
    const checklists = await Checklist.find({ task: task._id });
    for (const check of checklists) {
      const newCheck = new Checklist({
        task: duplicatedTask._id,
        title: check.title,
        items: check.items.map(item => ({ title: item.title, isCompleted: item.isCompleted }))
      });
      await newCheck.save();
    }

    res.status(201).json(duplicatedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// Time tracking actions
exports.toggleTimer = async (req, res) => {
  const { action } = req.body; // 'start', 'pause', 'stop'
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    if (action === 'start') {
      if (task.timerActive) {
        return res.status(400).json({ msg: 'Timer is already active' });
      }
      task.timerActive = true;
      task.timerStartedAt = new Date();
    } else if (action === 'pause' || action === 'stop') {
      if (!task.timerActive) {
        return res.status(400).json({ msg: 'Timer is not active' });
      }
      const elapsedSeconds = Math.round((new Date() - new Date(task.timerStartedAt)) / 1000);
      task.timeSpent += elapsedSeconds;
      task.timerActive = false;
      task.timerStartedAt = null;
    }

    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// Subtasks CRUD
exports.createSubtask = async (req, res) => {
  const { title } = req.body;
  const { taskId } = req.params;
  try {
    const subtask = new Subtask({
      task: taskId,
      title,
      status: 'Pending'
    });
    await subtask.save();

    res.status(201).json(subtask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.updateSubtaskStatus = async (req, res) => {
  const { subtaskId } = req.params;
  const { status } = req.body; // 'Pending' or 'Completed'
  try {
    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      return res.status(404).json({ msg: 'Subtask not found' });
    }

    subtask.status = status;
    await subtask.save();

    res.json(subtask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.deleteSubtask = async (req, res) => {
  const { subtaskId } = req.params;
  try {
    await Subtask.findByIdAndDelete(subtaskId);
    res.json({ msg: 'Subtask deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// Checklists CRUD
exports.createChecklist = async (req, res) => {
  const { title } = req.body;
  const { taskId } = req.params;
  try {
    const checklist = new Checklist({
      task: taskId,
      title,
      items: []
    });
    await checklist.save();
    res.status(201).json(checklist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.addChecklistItem = async (req, res) => {
  const { title } = req.body;
  const { checklistId } = req.params;
  try {
    const checklist = await Checklist.findById(checklistId);
    if (!checklist) {
      return res.status(404).json({ msg: 'Checklist not found' });
    }
    checklist.items.push({ title, isCompleted: false });
    await checklist.save();
    res.json(checklist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.toggleChecklistItem = async (req, res) => {
  const { checklistId, itemId } = req.params;
  try {
    const checklist = await Checklist.findById(checklistId);
    if (!checklist) {
      return res.status(404).json({ msg: 'Checklist not found' });
    }

    const item = checklist.items.id(itemId);
    if (!item) {
      return res.status(404).json({ msg: 'Checklist item not found' });
    }

    item.isCompleted = !item.isCompleted;
    await checklist.save();
    res.json(checklist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.deleteChecklist = async (req, res) => {
  const { checklistId } = req.params;
  try {
    await Checklist.findByIdAndDelete(checklistId);
    res.json({ msg: 'Checklist deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// Comments CRUD
exports.addComment = async (req, res) => {
  const { text, parentCommentId } = req.body;
  const { taskId } = req.params;
  try {
    const comment = new Comment({
      task: taskId,
      author: req.user.id,
      text,
      parentComment: parentCommentId || null
    });
    await comment.save();

    const populated = await Comment.findById(comment._id).populate('author', 'name email avatar');
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.deleteComment = async (req, res) => {
  const { commentId } = req.params;
  try {
    await Comment.findByIdAndDelete(commentId);
    res.json({ msg: 'Comment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};
