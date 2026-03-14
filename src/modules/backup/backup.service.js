const Message = require('../../models/Message');
const Chat = require('../../models/Chat');

const _verifyAccess = async (chatId, userId) => {
    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error('Chat not found');

    // Check if user is a participant
    const isParticipant = chat.participants.some(p => p.toString() === userId.toString());
    if (!isParticipant) {
        throw new Error('Access denied to backup this chat');
    }
    return chat;
};

exports.getBackupJSON = async (chatId, userId) => {
    await _verifyAccess(chatId, userId);

    // Fetch all messages (oldest first)
    const messages = await Message.find({ chatId })
        .populate('senderId', 'name email')
        .sort({ createdAt: 1 });

    return messages.map(msg => ({
        timestamp: msg.createdAt,
        sender: msg.senderId ? msg.senderId.name : 'Unknown User',
        content: msg.content,
        type: msg.type,
        reactions: msg.reactions,
        edited: msg.edited
    }));
};

exports.getBackupTXT = async (chatId, userId) => {
    const jsonStream = await this.getBackupJSON(chatId, userId);

    return jsonStream.map(msg => {
        const time = new Date(msg.timestamp).toLocaleString();
        const content = msg.type === 'image' ? '[Image Attachment]'
            : msg.type === 'file' ? '[File Attachment]'
                : msg.type === 'audio' ? '[Voice Message]'
                    : msg.content;

        return `[${time}] ${msg.sender}: ${content}${msg.edited ? ' (edited)' : ''}`;
    }).join('\n');
};
