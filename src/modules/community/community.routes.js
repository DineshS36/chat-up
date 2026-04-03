const express = require('express');
const router = express.Router();
const protect = require('../../middleware/auth');
const communityController = require('./community.controller');

router.use(protect); // All community routes require authentication

router.post('/', communityController.createCommunity);
router.get('/', communityController.getCommunities);
router.get('/:id', communityController.getCommunity);

module.exports = router;
