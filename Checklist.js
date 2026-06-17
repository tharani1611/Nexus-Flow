const mongoose = require('mongoose');

const ChecklistSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  items: [
    {
      title: {
        type: String,
        required: true,
        trim: true
      },
      isCompleted: {
        type: Boolean,
        default: false
      }
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model('Checklist', ChecklistSchema);
