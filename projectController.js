const Project = require('../models/Project');
const Task = require('../models/Task');

exports.createProject = async (req, res) => {
  const { name, description, priority, budget, deadline, type, members } = req.body;
  const { workspaceId } = req.params;
  try {
    const project = new Project({
      name,
      description,
      workspace: workspaceId,
      priority: priority || 'Medium',
      budget: budget || 0,
      deadline,
      type: type || 'Team',
      members: members || [req.user.id]
    });

    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.getWorkspaceProjects = async (req, res) => {
  const { workspaceId } = req.params;
  try {
    const projects = await Project.find({ workspace: workspaceId })
      .populate('members', 'name email avatar');
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.getProjectDetails = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('members', 'name email avatar');
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.updateProject = async (req, res) => {
  const { name, description, priority, budget, deadline, type, status, members } = req.body;
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (priority) project.priority = priority;
    if (budget !== undefined) project.budget = budget;
    if (deadline !== undefined) project.deadline = deadline;
    if (type) project.type = type;
    if (status) project.status = status;
    if (members) project.members = members;

    await project.save();
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    await Project.findByIdAndDelete(req.params.projectId);
    await Task.deleteMany({ project: req.params.projectId });

    res.json({ msg: 'Project and associated tasks deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.archiveProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    project.status = project.status === 'Archived' ? 'Active' : 'Archived';
    await project.save();

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.duplicateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Duplicate project
    const newProject = new Project({
      name: `${project.name} (Copy)`,
      description: project.description,
      workspace: project.workspace,
      priority: project.priority,
      budget: project.budget,
      deadline: project.deadline,
      type: project.type,
      members: project.members
    });
    await newProject.save();

    // Duplicate tasks
    const tasks = await Task.find({ project: project._id });
    for (const t of tasks) {
      const newTask = new Task({
        title: t.title,
        description: t.description,
        workspace: t.workspace,
        project: newProject._id,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
        storyPoints: t.storyPoints,
        labels: t.labels,
        assignee: t.assignee,
        reporter: t.reporter
      });
      await newTask.save();
    }

    res.json(newProject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.cloneProject = async (req, res) => {
  // Deep clone project structures
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    const cloned = new Project({
      name: `${project.name} (Clone)`,
      description: project.description,
      workspace: project.workspace,
      priority: project.priority,
      budget: project.budget,
      deadline: project.deadline,
      type: project.type,
      members: project.members
    });

    await cloned.save();
    res.json(cloned);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};
