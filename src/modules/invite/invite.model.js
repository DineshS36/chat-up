const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
    inviteCode: {
        type: String,
        unique: true,
        required: true,
        sparse: true
    },
    communityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        required: true
    },
    channelId: { // Optional: Invites that map directly into a specific channel context
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expiresAt: {
        type: Date,
        default: null // null means infinite expiry unless bounded
    },
    maxUses: {
        type: Number,
        default: 0 // 0 means unlimited uses
    },
    currentUses: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Invite = mongoose.model('Invite', inviteSchema);

module.exports = Invite;
