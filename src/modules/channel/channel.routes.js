const express = require('express');
const router = express.Router();
const channelController = require('./channel.controller');
const authMiddleware = require('../../middleware/auth'); // Reusing existing JWT logic
const validate = require('../../middleware/handleValidationErrors');
const v = require('../../middleware/validators');

router.use(authMiddleware);

router.post('/', v.createChannel, validate, channelController.createChannel);
router.get('/:communityId', v.getChannels, validate, channelController.getChannels);
router.delete('/:id', v.deleteChannel, validate, channelController.deleteChannel);

module.exports = router;
