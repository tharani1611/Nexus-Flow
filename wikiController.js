const Wiki = require('../models/Wiki');

exports.createWiki = async (req, res) => {
  const { title, content } = req.body;
  const { workspaceId } = req.params;
  try {
    const wiki = new Wiki({
      title,
      content,
      createdBy: req.user.id,
      workspace: workspaceId
    });

    await wiki.save();
    res.status(201).json(wiki);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.getWorkspaceWikis = async (req, res) => {
  const { workspaceId } = req.params;
  try {
    const wikis = await Wiki.find({ workspace: workspaceId })
      .populate('createdBy', 'name email avatar')
      .sort({ updatedAt: -1 });
    res.json(wikis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.getWikiDetails = async (req, res) => {
  try {
    const wiki = await Wiki.findById(req.params.wikiId)
      .populate('createdBy', 'name email avatar');
    if (!wiki) {
      return res.status(404).json({ msg: 'Wiki page not found' });
    }
    res.json(wiki);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.updateWiki = async (req, res) => {
  const { title, content } = req.body;
  try {
    const wiki = await Wiki.findById(req.params.wikiId);
    if (!wiki) {
      return res.status(404).json({ msg: 'Wiki page not found' });
    }

    if (title) wiki.title = title;
    if (content) wiki.content = content;
    wiki.version += 1;

    await wiki.save();
    res.json(wiki);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.deleteWiki = async (req, res) => {
  try {
    const wiki = await Wiki.findById(req.params.wikiId);
    if (!wiki) {
      return res.status(404).json({ msg: 'Wiki page not found' });
    }

    await Wiki.findByIdAndDelete(req.params.wikiId);
    res.json({ msg: 'Wiki page deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.searchWikis = async (req, res) => {
  const { workspaceId } = req.params;
  const { query } = req.query;
  try {
    if (!query) {
      return res.status(400).json({ msg: 'Search query is required' });
    }

    const wikis = await Wiki.find({
      workspace: workspaceId,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } }
      ]
    }).populate('createdBy', 'name email avatar');

    res.json(wikis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};
