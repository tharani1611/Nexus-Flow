const Meeting = require('../models/Meeting');

exports.createMeeting = async (req, res) => {
  const { roomName, project, scheduledTime } = req.body;
  const { workspaceId } = req.params;
  try {
    const meeting = new Meeting({
      host: req.user.id,
      roomName,
      workspace: workspaceId,
      project: project || null,
      scheduledTime: scheduledTime || new Date(),
      participants: [req.user.id],
      active: true
    });

    await meeting.save();
    res.status(201).json(meeting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.getWorkspaceMeetings = async (req, res) => {
  const { workspaceId } = req.params;
  try {
    const meetings = await Meeting.find({ workspace: workspaceId })
      .populate('host', 'name email avatar')
      .populate('participants', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(meetings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.joinMeeting = async (req, res) => {
  const { meetingId } = req.params;
  try {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ msg: 'Meeting not found' });
    }

    if (!meeting.participants.includes(req.user.id)) {
      meeting.participants.push(req.user.id);
      await meeting.save();
    }

    res.json(meeting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.endMeeting = async (req, res) => {
  const { meetingId } = req.params;
  try {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ msg: 'Meeting not found' });
    }

    if (meeting.host.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Only the host can end the meeting' });
    }

    meeting.active = false;
    await meeting.save();

    res.json(meeting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};
