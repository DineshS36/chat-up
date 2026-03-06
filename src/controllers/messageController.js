const Message = require('../models/Message');
const Chat = require('../models/Chat');

// @desc    Get all messages for a chat
// @route   GET /api/messages/:chatId
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if user is participant in chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      const error = new Error('Chat not found');
      error.status = 404;
      throw error;
    }

    const isParticipant = chat.participants.some(
      (participant) => participant.toString() === req.userId
    );

    if (!isParticipant) {
      const error = new Error('Not authorized to access these messages');
      error.status = 403;
      throw error;
    }

    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'username email avatar')
      .populate('readBy.user', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Message.countDocuments({ chat: chatId });

    res.json({
      success: true,
      count: messages.length,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: messages.reverse()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { chatId, content, messageType = 'text', fileUrl } = req.body;

    if (!chatId || !content) {
      const error = new Error('Chat ID and content are required');
      error.status = 400;
      throw error;
    }

    // Check if user is participant in chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      const error = new Error('Chat not found');
      error.status = 404;
      throw error;
    }

    const isParticipant = chat.participants.some(
      (participant) => participant.toString() === req.userId
    );

    if (!isParticipant) {
      const error = new Error('Not authorized to send messages in this chat');
      error.status = 403;
      throw error;
    }

    const message = await Message.create({
      chat: chatId,
      sender: req.userId,
      content,
      messageType,
      fileUrl
    });

    // Update chat's lastMessage
    chat.lastMessage = message._id;
    await chat.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username email avatar')
      .populate('readBy.user', 'username');

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:chatId
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const { chatId } = req.params;

    // Check if user is participant in chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      const error = new Error('Chat not found');
      error.status = 404;
      throw error;
    }

    const isParticipant = chat.participants.some(
      (participant) => participant.toString() === req.userId
    );

    if (!isParticipant) {
      const error = new Error('Not authorized');
      error.status = 403;
      throw error;
    }

    // Mark all unread messages in this chat as read by current user
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: req.userId },
        'readBy.user': { $ne: req.userId }
      },
      {
        $push: {
          readBy: {
            user: req.userId,
            readAt: new Date()
          }
        }
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      const error = new Error('Message not found');
      error.status = 404;
      throw error;
    }

    // Only sender can delete their message
    if (message.sender.toString() !== req.userId) {
      const error = new Error('Not authorized to delete this message');
      error.status = 403;
      throw error;
    }

    await Message.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};