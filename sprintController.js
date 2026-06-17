const Sprint = require('../models/Sprint');
const Task = require('../models/Task');

exports.createSprint = async (req, res) => {
  const { name, goal, duration, capacity } = req.body;
  const { projectId } = req.params;
  try {
    const sprint = new Sprint({
      name,
      project: projectId,
      goal: goal || '',
      duration: duration || 14,
      capacity: capacity || 0,
      status: 'Planned'
    });

    await sprint.save();
    res.status(201).json(sprint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.getProjectSprints = async (req, res) => {
  const { projectId } = req.params;
  try {
    const sprints = await Sprint.find({ project: projectId });
    res.json(sprints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.startSprint = async (req, res) => {
  const { sprintId } = req.params;
  try {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({ msg: 'Sprint not found' });
    }

    // Set other sprints of this project to inactive if active
    await Sprint.updateMany(
      { project: sprint.project, status: 'Active' },
      { status: 'Planned' }
    );

    sprint.status = 'Active';
    sprint.startDate = new Date();
    sprint.endDate = new Date(Date.now() + sprint.duration * 24 * 60 * 60 * 1000);
    
    await sprint.save();
    res.json(sprint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.completeSprint = async (req, res) => {
  const { sprintId } = req.params;
  const { moveIncompleteTo } = req.body; // Target sprintId or 'backlog'
  try {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({ msg: 'Sprint not found' });
    }

    sprint.status = 'Completed';
    sprint.endDate = new Date();
    await sprint.save();

    // Roll incomplete tasks (status NOT 'Done')
    if (moveIncompleteTo) {
      const targetSprint = moveIncompleteTo === 'backlog' ? null : moveIncompleteTo;
      await Task.updateMany(
        { sprint: sprintId, status: { $ne: 'Done' } },
        { sprint: targetSprint, status: targetSprint ? 'Todo' : 'Backlog' }
      );
    }

    res.json({ msg: 'Sprint completed successfully', sprint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.updateSprint = async (req, res) => {
  const { name, goal, duration, capacity } = req.body;
  const { sprintId } = req.params;
  try {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({ msg: 'Sprint not found' });
    }

    if (name) sprint.name = name;
    if (goal !== undefined) sprint.goal = goal;
    if (duration !== undefined) sprint.duration = duration;
    if (capacity !== undefined) sprint.capacity = capacity;

    await sprint.save();
    res.json(sprint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.deleteSprint = async (req, res) => {
  const { sprintId } = req.params;
  try {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({ msg: 'Sprint not found' });
    }

    // Set tasks in this sprint to backlog/no sprint
    await Task.updateMany({ sprint: sprintId }, { sprint: null, status: 'Backlog' });

    await Sprint.findByIdAndDelete(sprintId);
    res.json({ msg: 'Sprint deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};
