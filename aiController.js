const aiService = require('../services/aiService');

exports.generateDescription = async (req, res) => {
  const { title } = req.body;
  try {
    const description = await aiService.generateTaskDescription(title);
    res.json({ description });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error during description generation' });
  }
};

exports.suggestPriority = async (req, res) => {
  const { title, description } = req.body;
  try {
    const priority = await aiService.suggestPriority(title, description);
    res.json({ priority });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error during priority suggestion' });
  }
};

exports.estimateTime = async (req, res) => {
  const { title, storyPoints, priority } = req.body;
  try {
    const estimate = await aiService.estimateCompletionTime(title, storyPoints, priority);
    res.json({ estimate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error during time estimation' });
  }
};

exports.suggestSprint = async (req, res) => {
  const { tasks, capacity } = req.body;
  try {
    const suggestions = await aiService.suggestSprintPlanning(tasks, capacity);
    res.json(suggestions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error during sprint suggestions' });
  }
};
