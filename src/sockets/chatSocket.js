const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');
const { createMessage } = require('../services/messageService');

// In-memory map of userId → Set of socketIds (supports multi-device)
const onlineUsers = new Map();
const HEARTBEAT_INTERVAL = 30000;  // check every 30s
const STALE_THRESHOLD   = 60000;  // remove if no heartbeat for 60s
const MSG_RATE_LIMIT    = 30;     // max messages per window
const MSG_RATE_WINDOW   = 60000;  // 1 minute window

// Per-user message rate tracking: userId → { count, lastReset }
const messageRateMap = new Map();

// ─── Helper: get all socket IDs for a user ────────────────────────
const getSocketIds = (userId) => {
    const entry = onlineUsers.get(userId);
    if (!entry) return [];
    return [...entry.socketIds];
};

// ─── Helper: emit to all sockets of a specific user ───────────────
const emitToUser = (io, userId, event, data) => {
    const socketIds = getSocketIds(userId);
    socketIds.forEach(sid => io.to(sid).emit(event, data));
};

const chatSocket = async (io) => {
    // Reset all users to offline on server start
    try {
        await User.updateMany({}, { status: 'offline' });
        console.log('All users reset to offline status');
    } catch (err) {
        console.error('Error resetting users to offline:', err.message);
    }

    // ─── Stale-user cleanup interval ──────────────────────────
    setInterval(async () => {
        const now = Date.now();
        for (const [userId, entry] of onlineUsers.entries()) {
            if (now - entry.lastSeen > STALE_THRESHOLD) {
                onlineUsers.delete(userId);
                console.log(`[Cleanup] Stale user removed: ${userId}`);
                try {
                    await User.findByIdAndUpdate(userId, {
                        status: 'offline',
                        lastSeen: new Date(),
                    });
                    io.emit('user_status_update', {
                        userId,
                        status: 'offline',
                        lastSeen: new Date(),
                    });
                } catch (err) {
                    console.error('[Cleanup] Error updating stale user:', err.message);
                }
            }
        }
    }, HEARTBEAT_INTERVAL);

    io.on('connection', (socket) => {
        // Safety check — reject if auth middleware was bypassed
        if (!socket.user) {
            console.warn(`[Socket] Unauthenticated socket rejected: ${socket.id}`);
            socket.disconnect(true);
            return;
        }

        // FIX #1: Use the authenticated userId from the JWT token — never trust the client payload
        const authenticatedUserId = socket.user.userId;
        console.log(`Socket connected: ${socket.id} (user: ${authenticatedUserId})`);

        // ─── join ────────────────────────────────────────────────
        // Client sends: socket.emit('join', userId)
        // FIX #1: Ignore client-sent userId; use authenticated identity
        // FIX #2: Store multiple socket IDs per user for multi-device support
        socket.on('join', async (_clientUserId) => {
            const userId = authenticatedUserId; // enforce server-side identity

            let entry = onlineUsers.get(userId);
            if (!entry) {
                entry = { socketIds: new Set(), lastSeen: Date.now() };
                onlineUsers.set(userId, entry);
            }
            entry.socketIds.add(socket.id);
            entry.lastSeen = Date.now();

            console.log(`User joined: ${userId} → ${socket.id} (${entry.socketIds.size} active socket(s))`);
            console.log(`Online users: ${onlineUsers.size}`);

            // Update status in DB and broadcast
            try {
                await User.findByIdAndUpdate(userId, { status: 'online' });
                io.emit('user_status_update', { userId, status: 'online' });
            } catch (err) {
                console.error('Error updating user online status:', err.message);
            }
        });

        // ─── heartbeat ────────────────────────────────────────────
        // Client sends: socket.emit('heartbeat', userId)
        // FIX #1: Ignore client-sent userId; use authenticated identity
        socket.on('heartbeat', (_clientUserId) => {
            const entry = onlineUsers.get(authenticatedUserId);
            if (entry && entry.socketIds.has(socket.id)) {
                entry.lastSeen = Date.now();
            }
        });

        // ─── join_chat ───────────────────────────────────────────
        // Client sends: socket.emit('join_chat', chatId)
        // Joins the socket to a chat room for typing indicators
        socket.on('join_chat', (chatId) => {
            socket.join(chatId);
            console.log(`Socket ${socket.id} joined chat room: ${chatId}`);
        });

        // ─── send_message ────────────────────────────────────────
        // Client sends: socket.emit('send_message', { chatId, receiverId, content, replyTo })
        // FIX #1: senderId is enforced from socket.user.userId
        socket.on('send_message', async (data) => {
            try {
                const { chatId, receiverId, content, replyTo } = data;
                const senderId = authenticatedUserId; // FIX #1: enforce identity

                // ─── Socket rate limit check ───
                const now = Date.now();
                const rate = messageRateMap.get(senderId) || { count: 0, lastReset: now };

                // Reset window if expired
                if (now - rate.lastReset > MSG_RATE_WINDOW) {
                    rate.count = 0;
                    rate.lastReset = now;
                }

                rate.count++;
                messageRateMap.set(senderId, rate);

                if (rate.count > MSG_RATE_LIMIT) {
                    console.warn(`[RateLimit] User ${senderId} exceeded ${MSG_RATE_LIMIT} msgs/min`);
                    socket.emit('rate_limited', {
                        message: 'You are sending messages too fast. Please slow down.',
                    });
                    return;
                }

                // Validate required fields
                if (!chatId || !receiverId || !content) {
                    socket.emit('error', {
                        message: 'chatId, receiverId, and content are required',
                    });
                    return;
                }

                // Create message via service (single source of truth)
                const { message, chat, mentionIds } = await createMessage({
                    chatId, senderId, receiverId, content, replyTo,
                });

                // Auto stop typing when message is sent
                socket.to(chatId).emit('user_stop_typing', { chatId, senderId });

                const messagePayload = {
                    _id: message._id,
                    chatId: message.chatId,
                    senderId: message.senderId,
                    receiverId: message.receiverId,
                    content: message.content,
                    type: message.type,
                    status: message.status,
                    createdAt: message.createdAt,
                    replyTo: message.replyTo,
                    mentions: message.mentions,
                };

                console.log(`[Socket] Message saved: ${message._id} (${senderId} → ${receiverId}) in chat ${chatId}`);

                // Emit mention notifications
                if (mentionIds.length > 0) {
                    const sender = await User.findById(senderId).select('name');
                    mentionIds.forEach(mentionedUserId => {
                        emitToUser(io, mentionedUserId.toString(), 'mention_notification', {
                            chatId,
                            chatName: chat.name,
                            messageId: message._id,
                            senderName: sender?.name || 'Someone',
                            content: content.substring(0, 100)
                        });
                    });
                }

                // 1. Confirm to sender — so they can replace their optimistic temp message
                socket.emit('message_sent', messagePayload);

                // 2. Broadcast to all OTHER participants in the chat room
                socket.to(chatId).emit('receive_message', messagePayload);

                // 3. If receiver is online, mark as delivered and notify sender
                // FIX #2: Check any socket for the receiver
                const receiverSockets = getSocketIds(receiverId);
                if (receiverSockets.length > 0) {
                    await Message.findByIdAndUpdate(message._id, { status: 'delivered' });

                    // Notify sender that message was delivered (tick update)
                    socket.emit('message_delivered', { messageId: message._id });

                    console.log(`[Socket] Message delivered to online user: ${receiverId}`);
                } else {
                    console.log(`[Socket] User ${receiverId} is offline. Message stored for later.`);
                }
            } catch (error) {
                console.error('[Socket] Error sending message:', error.message);
                socket.emit('error', { message: error.message });
            }
        });

        // ─── messages_read ────────────────────────────────────────
        // Client sends: socket.emit('messages_read', { chatId })
        // FIX #1: userId is enforced from socket.user.userId
        socket.on('messages_read', async (data) => {
            try {
                const { chatId } = data;
                const userId = authenticatedUserId; // FIX #1: enforce identity

                if (!chatId) {
                    socket.emit('error', { message: 'chatId is required' });
                    return;
                }

                // Find unread messages from other users
                const unreadMessages = await Message.find({
                    chatId,
                    senderId: { $ne: userId },
                    status: { $ne: 'read' }
                });

                // Bulk update to read
                await Message.updateMany(
                    { chatId, senderId: { $ne: userId }, status: { $ne: 'read' } },
                    { status: 'read' }
                );

                // Collect unique senders and notify them (FIX #2: emit to all sockets)
                const senderIds = [...new Set(unreadMessages.map(m => m.senderId.toString()))];
                senderIds.forEach((senderId) => {
                    emitToUser(io, senderId, 'messages_read', { chatId });
                });

                console.log(`Messages in chat ${chatId} marked as read by ${userId}`);
            } catch (error) {
                console.error('Error marking messages as read:', error.message);
                socket.emit('error', { message: error.message });
            }
        });

        // ─── typing ──────────────────────────────────────────────
        // Client sends: socket.emit('typing', { chatId })
        // FIX #1: senderId is enforced from socket.user.userId
        socket.on('typing', ({ chatId }) => {
            socket.to(chatId).emit('user_typing', { chatId, senderId: authenticatedUserId });
        });

        // ─── stop_typing ─────────────────────────────────────────
        // Client sends: socket.emit('stop_typing', { chatId })
        // FIX #1: senderId is enforced from socket.user.userId
        socket.on('stop_typing', ({ chatId }) => {
            socket.to(chatId).emit('user_stop_typing', { chatId, senderId: authenticatedUserId });
        });

        // ─── WebRTC Signaling for Audio/Video Calls ───────────────────
        // FIX #1: callerId is enforced from socket.user.userId
        socket.on('call_user', async ({ receiverId, callerName, chatId, callType }) => {
            const callerId = authenticatedUserId;
            const receiverSockets = getSocketIds(receiverId);
            if (receiverSockets.length > 0) {
                // Emit to all receiver sockets (FIX #2)
                receiverSockets.forEach(sid => {
                    io.to(sid).emit('incoming_call', {
                        callerId,
                        callerName,
                        chatId,
                        callType
                    });
                });
            } else {
                // If receiver is offline, instantly reject
                socket.emit('call_rejected', { reason: 'User is offline' });
            }
        });

        socket.on('call_accepted', ({ callerId }) => {
            emitToUser(io, callerId, 'call_accepted', { receiverId: authenticatedUserId });
        });

        socket.on('call_rejected', ({ callerId }) => {
            emitToUser(io, callerId, 'call_rejected', { reason: 'Call declined' });
        });

        socket.on('webrtc_signal', ({ targetId, signal }) => {
            emitToUser(io, targetId, 'webrtc_signal', { signal, from: authenticatedUserId });
        });

        socket.on('end_call', ({ targetId }) => {
            emitToUser(io, targetId, 'end_call', {});
        });

        // ─── COMMUNITY & CHANNEL SOCKET DOMAINS ──────────────────

        // ─── join_community
        socket.on('join_community', (communityId) => {
            socket.join(`community_${communityId}`);
            console.log(`Socket ${socket.id} joined community: ${communityId}`);
        });

        // ─── leave_community
        socket.on('leave_community', (communityId) => {
            socket.leave(`community_${communityId}`);
            console.log(`Socket ${socket.id} left community: ${communityId}`);
        });

        // ─── community_update
        socket.on('community_update', ({ communityId, updateData }) => {
            // Broadcasts metadata changes (name, avatar, roles)
            socket.to(`community_${communityId}`).emit('community_update', updateData);
        });

        // ─── join_channel
        socket.on('join_channel', (channelId) => {
            socket.join(`channel_${channelId}`);
            console.log(`Socket ${socket.id} joined channel: ${channelId}`);
        });

        // ─── leave_channel
        socket.on('leave_channel', (channelId) => {
            socket.leave(`channel_${channelId}`);
            console.log(`Socket ${socket.id} left channel: ${channelId}`);
        });

        // ─── send_channel_message
        // FIX #1: senderId is enforced from socket.user.userId
        socket.on('send_channel_message', async (data) => {
            try {
                const { channelId, content } = data;
                const senderId = authenticatedUserId;
                if (!channelId || !content) return;

                // Fire event strictly to channel participants
                io.to(`channel_${channelId}`).emit('channel_message', {
                    _id: Date.now().toString(), // Mocked fast DB ID
                    channelId,
                    senderId,
                    content,
                    createdAt: new Date()
                });

                // Ideally we'd persist this using a modular ChannelMessage DB model,
                // but for Stage 2, transient broadcast shows proof of concept.
                console.log(`Broadcasted channel message in ${channelId} from ${senderId}`);
            } catch (err) {
                console.error("Error sending channel message:", err);
            }
        });

        // ─── disconnect ──────────────────────────────────────────
        // Automatically fired when a client disconnects
        // FIX #2: Removes only this socket from the user's set; marks offline only when last socket disconnects
        socket.on('disconnect', async () => {
            const userId = authenticatedUserId;
            const entry = onlineUsers.get(userId);

            if (entry) {
                entry.socketIds.delete(socket.id);
                console.log(`Socket disconnected: ${userId} (${socket.id}), ${entry.socketIds.size} remaining`);

                // Only mark offline if no more active sockets
                if (entry.socketIds.size === 0) {
                    onlineUsers.delete(userId);
                    console.log(`User fully disconnected: ${userId}`);

                    try {
                        const lastSeen = new Date();
                        await User.findByIdAndUpdate(userId, {
                            status: 'offline',
                            lastSeen,
                        });
                        io.emit('user_status_update', {
                            userId,
                            status: 'offline',
                            lastSeen,
                        });
                    } catch (err) {
                        console.error('Error updating user offline status:', err.message);
                    }
                }
            }
        });
    });
};

module.exports = chatSocket;
