const Workspace = require('../models/Workspace');
const User = require('../models/User');

exports.createWorkspace = async (req, res) => {
  const { name } = req.body;
  try {
    const workspace = new Workspace({
      name,
      createdBy: req.user.id,
      members: [{ user: req.user.id, role: 'Super Admin' }]
    });

    await workspace.save();
    res.status(201).json(workspace);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.getUserWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      $or: [
        { createdBy: req.user.id },
        { 'members.user': req.user.id }
      ]
    }).populate('members.user', 'name email avatar');

    res.json(workspaces);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.getWorkspaceDetails = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId)
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email avatar');
      
    if (!workspace) {
      return res.status(404).json({ msg: 'Workspace not found' });
    }
    res.json(workspace);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.inviteUser = async (req, res) => {
  const { email, role } = req.body;
  const { workspaceId } = req.params;
  try {
    const invitee = await User.findOne({ email });
    if (!invitee) {
      return res.status(404).json({ msg: 'User with this email not found' });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ msg: 'Workspace not found' });
    }

    // Check if already a member
    const isMember = workspace.members.some(
      m => m.user.toString() === invitee._id.toString()
    );

    if (isMember) {
      return res.status(400).json({ msg: 'User is already a member of this workspace' });
    }

    workspace.members.push({ user: invitee._id, role: role || 'Developer' });
    await workspace.save();

    const updatedWorkspace = await Workspace.findById(workspaceId).populate('members.user', 'name email avatar');
    res.json(updatedWorkspace);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.removeUser = async (req, res) => {
  const { userId } = req.body;
  const { workspaceId } = req.params;
  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ msg: 'Workspace not found' });
    }

    if (workspace.createdBy.toString() === userId) {
      return res.status(400).json({ msg: 'Cannot remove the creator of the workspace' });
    }

    workspace.members = workspace.members.filter(
      m => m.user.toString() !== userId
    );

    await workspace.save();
    res.json({ msg: 'User removed from workspace', workspace });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.leaveWorkspace = async (req, res) => {
  const { workspaceId } = req.params;
  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ msg: 'Workspace not found' });
    }

    if (workspace.createdBy.toString() === req.user.id) {
      return res.status(400).json({ msg: 'Creator cannot leave the workspace. Delete it instead.' });
    }

    workspace.members = workspace.members.filter(
      m => m.user.toString() !== req.user.id
    );

    await workspace.save();
    res.json({ msg: 'Successfully left the workspace' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.updateWorkspace = async (req, res) => {
  const { name } = req.body;
  const { workspaceId } = req.params;
  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ msg: 'Workspace not found' });
    }

    if (name) workspace.name = name;
    await workspace.save();

    res.json(workspace);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.deleteWorkspace = async (req, res) => {
  const { workspaceId } = req.params;
  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ msg: 'Workspace not found' });
    }

    if (workspace.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Only the workspace creator can delete it' });
    }

    await Workspace.findByIdAndDelete(workspaceId);
    res.json({ msg: 'Workspace deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};
