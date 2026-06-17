const Message = require('../models/Message');

exports.getWorkspaceMessages = async (req, res) => {
  const { workspaceId } = req.params;
  try {
    const messages = await Message.find({
      chatType: 'Workspace',
      targetId: workspaceId
    })
    .populate('sender', 'name email avatar')
    .sort({ createdAt: 1 })
    .limit(100);

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.getProjectMessages = async (req, res) => {
  const { projectId } = req.params;
  try {
    const messages = await Message.find({
      chatType: 'Project',
      targetId: projectId
    })
    .populate('sender', 'name email avatar')
    .sort({ createdAt: 1 })
    .limit(100);

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.getDirectMessages = async (req, res) => {
  const { recipientId } = req.params;
  const userId = req.user.id;
  try {
    const messages = await Message.find({
      chatType: 'Direct',
      $or: [
        { sender: userId, targetId: recipientId },
        { sender: recipientId, targetId: userId }
      ]
    })
    .populate('sender', 'name email avatar')
    .sort({ createdAt: 1 })
    .limit(100);

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};
