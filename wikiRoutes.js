const express = require('express');
const router = express.Router();
const wikiController = require('../controllers/wikiController');
const auth = require('../middlewares/auth');

router.use(auth);

router.post('/workspace/:workspaceId', wikiController.createWiki);
router.get('/workspace/:workspaceId', wikiController.getWorkspaceWikis);
router.get('/workspace/:workspaceId/search', wikiController.searchWikis);
router.get('/:wikiId', wikiController.getWikiDetails);
router.put('/:wikiId', wikiController.updateWiki);
router.delete('/:wikiId', wikiController.deleteWiki);

module.exports = router;
