const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
    communityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    type: {
        type: String,
        enum: ['text', 'voice'],
        default: 'text'
    },
    members: [{
        // Optional: specific channel members (e.g. for private channels inside a community)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    permissions: {
        send_messages: [{ type: String }], // Array of Role strings
        delete_messages: [{ type: String }],
        manage_messages: [{ type: String }],
        connect_voice: [{ type: String }]
        // If empty, falls back to Community defaults (e.g., all members can send by default unless restricted)
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensures a channel name is unique inside its specific community
channelSchema.index({ communityId: 1, name: 1 }, { unique: true });

const Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;
