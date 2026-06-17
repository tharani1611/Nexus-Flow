const mongoose = require('mongoose');

const SprintSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  goal: {
    type: String,
    default: ''
  },
  duration: {
    type: Number, // in days
    default: 14
  },
  capacity: {
    type: Number, // e.g. story points
    default: 0
  },
  status: {
    type: String,
    enum: ['Planned', 'Active', 'Completed'],
    default: 'Planned'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Sprint', SprintSchema);
