const Report = require('../models/Report');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Sprint = require('../models/Sprint');
const exportService = require('../services/exportService');

exports.generateReport = async (req, res) => {
  const { workspaceId } = req.params;
  const { format, name } = req.body; // 'PDF' or 'Excel'

  try {
    if (!format || !['PDF', 'Excel'].includes(format)) {
      return res.status(400).json({ msg: 'Format must be PDF or Excel' });
    }

    const projects = await Project.find({ workspace: workspaceId });
    const projectIds = projects.map(p => p._id);

    const tasks = await Task.find({ project: { $in: projectIds } }).populate('assignee', 'name email');
    const sprints = await Sprint.find({ project: { $in: projectIds } });

    // Calculate Stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Done').length;
    const pendingTasks = totalTasks - completedTasks;
    const totalSprints = sprints.length;

    const stats = {
      totalTasks,
      completedTasks,
      pendingTasks,
      totalSprints
    };

    const reportName = name || `Workspace_Report_${Date.now()}`;
    let fileUrl = '';

    if (format === 'PDF') {
      fileUrl = await exportService.generatePDFReport(reportName, tasks, stats);
    } else {
      fileUrl = await exportService.generateExcelReport(reportName, tasks, stats);
    }

    const report = new Report({
      generatedBy: req.user.id,
      name: reportName,
      format,
      url: fileUrl,
      workspace: workspaceId
    });

    await report.save();
    res.status(201).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error during report generation' });
  }
};

exports.getWorkspaceReports = async (req, res) => {
  const { workspaceId } = req.params;
  try {
    const reports = await Report.find({ workspace: workspaceId })
      .populate('generatedBy', 'name email avatar')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};
