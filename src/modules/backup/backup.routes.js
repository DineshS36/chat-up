const express = require('express');
const router = express.Router();
const backupController = require('./backup.controller');
const authMiddleware = require('../../middleware/auth');

router.use(authMiddleware);

// Example: GET /api/backup/:chatId?format=txt
router.get('/:chatId', backupController.exportChat);

module.exports = router;
