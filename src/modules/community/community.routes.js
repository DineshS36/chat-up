const express = require('express');
const router = express.Router();
const protect = require('../../middleware/auth');
const communityController = require('./community.controller');
const validate = require('../../middleware/handleValidationErrors');
const v = require('../../middleware/validators');

router.use(protect); // All community routes require authentication

router.post('/', v.createCommunity, validate, communityController.createCommunity);
router.get('/', communityController.getCommunities);
router.get('/:id', communityController.getCommunity);

module.exports = router;
