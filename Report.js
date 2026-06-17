const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  format: {
    type: String,
    enum: ['PDF', 'Excel'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', ReportSchema);
