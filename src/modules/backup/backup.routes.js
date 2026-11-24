const express = require('express');
const router = express.Router();
const backupController = require('./backup.controller');
const authMiddleware = require('../../middleware/auth');
const validate = require('../../middleware/handleValidationErrors');
const v = require('../../middleware/validators');

router.use(authMiddleware);

// Example: GET /api/backup/:chatId?format=txt
router.get('/:chatId', v.exportChat, validate, backupController.exportChat);

module.exports = router;
