const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    avatar: {
        type: String,
        default: ""
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['Owner', 'Admin', 'Moderator', 'Member', 'Guest'],
            default: 'Member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    channels: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel'
    }],
    inviteLinks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invite'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create compound index to enforce unique members within a community
communitySchema.index({ "members.user": 1, _id: 1 });

const Community = mongoose.model('Community', communitySchema);

module.exports = Community;
