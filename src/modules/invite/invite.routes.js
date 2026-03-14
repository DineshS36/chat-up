const express = require('express');
const router = express.Router();
const inviteController = require('./invite.controller');
const authMiddleware = require('../../middleware/auth');

// Authenticated routes
router.use(authMiddleware);

router.post('/', inviteController.createInvite);
router.get('/:code', inviteController.validateInvite); // Useful for previewing Community before confirming
router.post('/:code/join', inviteController.joinViaInvite);

module.exports = router;
