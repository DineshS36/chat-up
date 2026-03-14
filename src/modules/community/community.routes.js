const express = require('express');
const router = express.Router();
const communityController = require('./community.controller');
const authMiddleware = require('../../middleware/auth'); // Reusing existing JWT logic

// All community routes require authentication
router.use(authMiddleware);

router.post('/', communityController.createCommunity);
router.get('/', communityController.getUserCommunities);
router.get('/:id', communityController.getCommunityById);
router.delete('/:id', communityController.deleteCommunity);

module.exports = router;
