const express = require('express');
const router = express.Router();
const inviteController = require('./invite.controller');
const authMiddleware = require('../../middleware/auth');
const validate = require('../../middleware/handleValidationErrors');
const v = require('../../middleware/validators');

// Authenticated routes
router.use(authMiddleware);

router.post('/', v.createInvite, validate, inviteController.createInvite);
router.get('/:code', v.validateInviteCode, validate, inviteController.validateInvite); // Useful for previewing Community before confirming
router.post('/:code/join', v.validateInviteCode, validate, inviteController.joinViaInvite);

module.exports = router;
