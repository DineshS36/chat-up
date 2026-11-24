const express = require('express');
const {
  getMessages,
  sendMessage,
  markAsRead,
  editMessage,
  deleteMessage,
  searchMessages,
  reactToMessage,
  uploadFile,
  forwardMessage,
  scheduleMessage
} = require('../controllers/messageController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const fileValidator = require('../middleware/fileValidator');
const validate = require('../middleware/handleValidationErrors');
const v = require('../middleware/validators');

const router = express.Router();

// All routes are protected
router.use(auth);

router.get('/search/:chatId', v.searchMessages, validate, searchMessages);
router.get('/:chatId', v.getMessages, validate, getMessages);
router.post('/upload', upload.single('file'), fileValidator, v.uploadFile, validate, uploadFile);
router.post('/forward', v.forwardMessage, validate, forwardMessage);
router.post('/schedule', v.scheduleMessage, validate, scheduleMessage);
router.post('/', v.sendMessage, validate, sendMessage);
router.post('/:id/react', v.reactToMessage, validate, reactToMessage);
router.put('/read/:chatId', v.markAsRead, validate, markAsRead);
router.put('/:id', v.editMessage, validate, editMessage);
router.delete('/:id', v.deleteMessage, validate, deleteMessage);

module.exports = router;