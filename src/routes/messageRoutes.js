const express = require('express');
const {
  getMessages,
  sendMessage,
  markAsRead,
  editMessage,
  deleteMessage,
  searchMessages,
  reactToMessage
} = require('../controllers/messageController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

router.get('/search/:chatId', searchMessages);
router.get('/:chatId', getMessages);
router.post('/', sendMessage);
router.post('/:id/react', reactToMessage);
router.put('/read/:chatId', markAsRead);
router.put('/:id', editMessage);
router.delete('/:id', deleteMessage);

module.exports = router;