const express = require('express');
const router = express.Router();
const channelController = require('./channel.controller');
const authMiddleware = require('../../middleware/auth'); // Reusing existing JWT logic

router.use(authMiddleware);

router.post('/', channelController.createChannel);
router.get('/:communityId', channelController.getChannels);
router.delete('/:id', channelController.deleteChannel);

module.exports = router;
