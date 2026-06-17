const mongoose = require('mongoose');

const WorkspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      role: {
        type: String,
        enum: ['Super Admin', 'Admin', 'Manager', 'Team Lead', 'Developer', 'Tester', 'Viewer'],
        default: 'Developer'
      }
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model('Workspace', WorkspaceSchema);
