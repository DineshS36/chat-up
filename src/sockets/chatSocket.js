const Message = require('../models/Message');

// In-memory map of userId → socketId
const onlineUsers = new Map();

const chatSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // ─── join ────────────────────────────────────────────────
        // Client sends: socket.emit('join', userId)
        // Stores the userId ↔ socketId mapping
        socket.on('join', (userId) => {
            onlineUsers.set(userId, socket.id);
            console.log(`User joined: ${userId} → ${socket.id}`);
            console.log(`Online users: ${onlineUsers.size}`);
        });

        // ─── send_message ────────────────────────────────────────
        // Client sends: socket.emit('send_message', { senderId, receiverId, content })
        // 1. Persists the message in MongoDB
        // 2. Emits 'receive_message' to the receiver if online
        socket.on('send_message', async (data) => {
            try {
                const { senderId, receiverId, content } = data;

                // Validate required fields
                if (!senderId || !receiverId || !content) {
                    socket.emit('error', {
                        message: 'senderId, receiverId, and content are required',
                    });
                    return;
                }

                // Save message to MongoDB
                const message = await Message.create({
                    senderId,
                    receiverId,
                    content,
                    type: 'text',
                    status: 'sent',
                });

                console.log(`Message saved: ${message._id} (${senderId} → ${receiverId})`);

                // Check if receiver is online
                const receiverSocketId = onlineUsers.get(receiverId);

                if (receiverSocketId) {
                    // Emit to the receiver's socket
                    io.to(receiverSocketId).emit('receive_message', {
                        _id: message._id,
                        senderId: message.senderId,
                        receiverId: message.receiverId,
                        content: message.content,
                        type: message.type,
                        status: message.status,
                        createdAt: message.createdAt,
                    });

                    console.log(`Message delivered to online user: ${receiverId}`);
                } else {
                    console.log(`User ${receiverId} is offline. Message stored for later.`);
                }
            } catch (error) {
                console.error('Error sending message:', error.message);
                socket.emit('error', { message: error.message });
            }
        });

        // ─── disconnect ──────────────────────────────────────────
        // Automatically fired when a client disconnects
        // Removes the userId from the online map
        socket.on('disconnect', () => {
            // Find and remove the user by their socketId
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    console.log(`User disconnected: ${userId} (${socket.id})`);
                    break;
                }
            }
        });
    });
};

module.exports = chatSocket;
