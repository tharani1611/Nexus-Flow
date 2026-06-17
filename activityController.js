const Activity = require('../models/Activity');

exports.getWorkspaceActivities = async (req, res) => {
  const { workspaceId } = req.params;
  try {
    const activities = await Activity.find({ workspace: workspaceId })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(activities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};
