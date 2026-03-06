const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');

// Store connected users
const connectedUsers = new Map();

const socketHandler = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.userId})`);
    
    // Store user connection
    connectedUsers.set(socket.userId, socket.id);
    
    // Update user status to online
    User.findByIdAndUpdate(socket.userId, { 
      status: 'online',
      lastSeen: new Date()
    }).exec();

    // Broadcast user's online status to their contacts
    socket.broadcast.emit('userOnline', {
      userId: socket.userId,
      status: 'online'
    });

    // Join user to their chat rooms
    socket.on('joinChat', async (chatId) => {
      try {
        const chat = await Chat.findById(chatId);
        
        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }

        const isParticipant = chat.participants.some(
          (participant) => participant.toString() === socket.userId
        );
      
        if (!isParticipant) {
          socket.emit('error', { message: 'Not authorized to join this chat' });
          return;
        }

        socket.join(chatId);
        console.log(`User ${socket.user.username} joined chat: ${chatId}`);
        
        socket.emit('joinedChat', { chatId });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Leave chat room
    socket.on('leaveChat', (chatId) => {
      socket.leave(chatId);
      console.log(`User ${socket.user.username} left chat: ${chatId}`);
      socket.emit('leftChat', { chatId });
    });

    // Handle sending messages
    socket.on('sendMessage', async (data) => {
      try {
        const { chatId, content, messageType = 'text', fileUrl } = data;

        // Verify user is in the chat
        const chat = await Chat.findById(chatId);

        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }

        const isParticipant = chat.participants.some(
          (participant) => participant.toString() === socket.userId
        );

        if (!isParticipant) {
          socket.emit('error', { message: 'Not authorized to send messages in this chat' });
          return;
        }

        // Create and save message
        const message = await Message.create({
          chat: chatId,
          sender: socket.userId,
          content,
          messageType,
          fileUrl
        });

        // Populate sender information
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username email avatar');

        // Update chat's lastMessage
        chat.lastMessage = message._id;
        await chat.save();

        // Broadcast message to all users in the chat room
        io.to(chatId).emit('newMessage', {
          chatId,
          message: populatedMessage
        });

        // Notify offline participants
        chat.participants.forEach(participantId => {
          if (participantId.toString() !== socket.userId) {
            const participantSocketId = connectedUsers.get(participantId.toString());
            if (!participantSocketId) {
              // User is offline - could send push notification here
              console.log(`User ${participantId} is offline, message stored`);
            }
          }
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { chatId, isTyping } = data;
      socket.to(chatId).emit('userTyping', {
        chatId,
        userId: socket.userId,
        username: socket.user.username,
        isTyping
      });
    });

    // Handle message read receipts
    socket.on('markAsRead', async (data) => {
      try {
        const { chatId } = data;

        await Message.updateMany(
          {
            chat: chatId,
            sender: { $ne: socket.userId },
            'readBy.user': { $ne: socket.userId }
          },
          {
            $push: {
              readBy: {
                user: socket.userId,
                readAt: new Date()
              }
            }
          }
        );

        // Notify other users that messages have been read
        socket.to(chatId).emit('messagesRead', {
          chatId,
          userId: socket.userId
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username} (${socket.userId})`);
      
      // Remove from connected users
      connectedUsers.delete(socket.userId);
      
      // Update user status to offline
      await User.findByIdAndUpdate(socket.userId, { 
        status: 'offline',
        lastSeen: new Date()
      });

      // Broadcast user's offline status
      socket.broadcast.emit('userOffline', {
        userId: socket.userId,
        status: 'offline',
        lastSeen: new Date()
      });
    });
  });
};

module.exports = socketHandler;