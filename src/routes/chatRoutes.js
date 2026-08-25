const express = require('express');
const {
  getChats,
  getChat,
  getChatsByUserId,
  createChat,
  createGroupChat,
  addToGroup,
  removeFromGroup,
  markChatAsRead,
  pinMessage,
  unpinMessage,
  leaveGroup
} = require('../controllers/chatController');
const auth = require('../middleware/auth');
const validate = require('../middleware/handleValidationErrors');
const v = require('../middleware/validators');

const router = express.Router();

// All routes are protected
router.use(auth);

router.get('/', getChats);
router.get('/user/:userId', v.getChatsByUserId, validate, getChatsByUserId);
router.get('/:id', v.getChat, validate, getChat);
router.post('/', v.createChat, validate, createChat);
router.post('/group', v.createGroupChat, validate, createGroupChat);
router.post('/:chatId/pin', v.pinMessage, validate, pinMessage);
router.delete('/:chatId/pin/:messageId', v.unpinMessage, validate, unpinMessage);
router.put('/:chatId/read', v.markChatAsRead, validate, markChatAsRead);
router.put('/:id/add', v.addToGroup, validate, addToGroup);
router.put('/:id/remove', v.removeFromGroup, validate, removeFromGroup);
router.put('/:id/leave', v.leaveGroup, validate, leaveGroup);

module.exports = router;