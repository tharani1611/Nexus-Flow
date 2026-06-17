const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Archived'],
    default: 'Active'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  budget: {
    type: Number,
    default: 0
  },
  deadline: {
    type: Date
  },
  progress: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ['Personal', 'Team', 'Client'],
    default: 'Team'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', ProjectSchema);
