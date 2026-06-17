const File = require('../models/File');
const fs = require('fs');
const path = require('path');

exports.uploadFile = async (req, res) => {
  const { taskId, projectId } = req.body;
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const file = new File({
      task: taskId || null,
      project: projectId || null,
      uploader: req.user.id,
      name: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
      size: req.file.size
    });

    await file.save();
    res.status(201).json(file);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.getProjectFiles = async (req, res) => {
  const { projectId } = req.params;
  try {
    const files = await File.find({ project: projectId })
      .populate('uploader', 'name email avatar')
      .populate('task', 'title')
      .sort({ createdAt: -1 });

    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.getTaskFiles = async (req, res) => {
  const { taskId } = req.params;
  try {
    const files = await File.find({ task: taskId })
      .populate('uploader', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ msg: 'File metadata not found' });
    }

    // Delete actual file from uploads folder
    const diskPath = path.join(__dirname, '..', file.path);
    if (fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath);
    }

    await File.findByIdAndDelete(req.params.fileId);
    res.json({ msg: 'File deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};
