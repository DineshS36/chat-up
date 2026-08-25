const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');
const { createMessage } = require('../services/messageService');
const presence = require('../services/presenceService');
const abuseService = require('../services/abuseService');

const HEARTBEAT_INTERVAL = 30000;  // check every 30s

const chatSocket = async (io) => {
    // Initialize presence service (connects to Redis)
    presence.init();

    // Reset all users to offline on server start
    try {
        await User.updateMany({}, { status: 'offline' });
        console.log('All users reset to offline status');
    } catch (err) {
        console.error('Error resetting users to offline:', err.message);
    }

    // ─── Stale-user cleanup interval ──────────────────────────
    setInterval(async () => {
        try {
            const staleEntries = await presence.getStaleEntries();

            // Get unique userIds from stale entries
            const staleUserIds = [...new Set(staleEntries.map(e => e.userId))];

            for (const userId of staleUserIds) {
                // Only mark offline if user has no remaining sockets
                const isStillOnline = await presence.isOnline(userId);
                if (!isStillOnline) {
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
        } catch (err) {
            console.error('[Cleanup] Error during stale cleanup:', err.message);
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

            await presence.addSocket(userId, socket.id);

            const socketIds = await presence.getSocketIds(userId);
            console.log(`User joined: ${userId} → ${socket.id} (${socketIds.length} active socket(s))`);

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
            presence.updateHeartbeat(authenticatedUserId, socket.id);
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

                // ─── Abuse suspension check ───
                const { suspended, remainingSeconds } = await abuseService.isSuspended(senderId);
                if (suspended) {
                    socket.emit('account_suspended', {
                        message: 'Your account is temporarily suspended due to abuse.',
                        remainingSeconds,
                    });
                    return;
                }

                // ─── Rate limit check (Redis-backed) ───
                const withinLimit = await presence.checkRate(senderId);
                if (!withinLimit) {
                    console.warn(`[RateLimit] User ${senderId} exceeded ${presence.MSG_RATE_LIMIT} msgs/min`);
                    socket.emit('rate_limited', {
                        message: 'You are sending messages too fast. Please slow down.',
                    });
                    // Record violation for escalating suspension
                    await abuseService.recordRateLimitViolation(senderId);
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
                    for (const mentionedUserId of mentionIds) {
                        await presence.emitToUser(io, mentionedUserId.toString(), 'mention_notification', {
                            chatId,
                            chatName: chat.name,
                            messageId: message._id,
                            senderName: sender?.name || 'Someone',
                            content: content.substring(0, 100)
                        });
                    }
                }

                // 1. Confirm to sender — so they can replace their optimistic temp message
                socket.emit('message_sent', messagePayload);

                // 2. Broadcast to all OTHER participants in the chat room
                socket.to(chatId).emit('receive_message', messagePayload);

                // 3. If receiver is online, mark as delivered and notify sender
                const receiverSockets = await presence.getSocketIds(receiverId);
                if (receiverSockets.length > 0) {
                    await Message.findByIdAndUpdate(message._id, { status: 'delivered' });

                    // Notify sender that message was delivered (tick update)
                    socket.emit('message_delivered', { messageId: message._id });

                    console.log(`[Socket] Message delivered to online user: ${receiverId}`);
                } else {
                    console.log(`[Socket] User ${receiverId} is offline. Message stored for later.`);
                }

                // ─── Track message hash for duplicate flooding detection ───
                if (content) {
                    await abuseService.trackMessageHash(senderId, content);
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

                // Collect unique senders and notify them
                const senderIds = [...new Set(unreadMessages.map(m => m.senderId.toString()))];
                for (const senderId of senderIds) {
                    await presence.emitToUser(io, senderId, 'messages_read', { chatId });
                }

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
            const receiverSockets = await presence.getSocketIds(receiverId);
            if (receiverSockets.length > 0) {
                // Emit to all receiver sockets
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
            presence.emitToUser(io, callerId, 'call_accepted', { receiverId: authenticatedUserId });
        });

        socket.on('call_rejected', ({ callerId }) => {
            presence.emitToUser(io, callerId, 'call_rejected', { reason: 'Call declined' });
        });

        socket.on('webrtc_signal', ({ targetId, signal }) => {
            presence.emitToUser(io, targetId, 'webrtc_signal', { signal, from: authenticatedUserId });
        });

        socket.on('end_call', ({ targetId }) => {
            presence.emitToUser(io, targetId, 'end_call', {});
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
        socket.on('disconnect', async () => {
            const userId = authenticatedUserId;

            const remainingSockets = await presence.removeSocket(userId, socket.id);
            console.log(`Socket disconnected: ${userId} (${socket.id}), ${remainingSockets} remaining`);

            // Only mark offline if no more active sockets
            if (remainingSockets === 0) {
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
        });
    });
};

module.exports = chatSocket;
