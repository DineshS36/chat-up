const Channel = require('./channel.model');
const Community = require('../community/community.model');

// Check if user has specific permission in a community 
const _hasCommunityPermission = async (communityId, userId, permission) => {
    const community = await Community.findById(communityId);
    if (!community) return false;

    const member = community.members.find(m => m.user.toString() === userId.toString());
    if (!member) return false;

    // Default Role Hierarchy Checks
    const role = member.role;
    if (role === 'Owner' || role === 'Admin') return true; // Full access

    if (permission === 'manage_channels' && role === 'Moderator') return true;

    return false;
};

exports.createChannel = async (communityId, userId, name, type) => {
    // 1. Check permissions
    const canCreate = await _hasCommunityPermission(communityId, userId, 'manage_channels');
    if (!canCreate) {
        throw new Error('Insufficient permissions to create channels');
    }

    // 2. Validate channel limits or existing names
    const existing = await Channel.findOne({ communityId, name });
    if (existing) {
        throw new Error('A channel with this name already exists in the community');
    }

    // 3. Create the channel
    const channel = new Channel({
        communityId,
        name,
        type: type || 'text'
    });

    await channel.save();

    // 4. Update community array
    await Community.findByIdAndUpdate(communityId, {
        $push: { channels: channel._id }
    });

    return channel;
};

exports.getChannelsByCommunity = async (communityId, userId) => {
    // Basic check: is user in community
    const community = await Community.findOne({
        _id: communityId,
        "members.user": userId
    });

    if (!community) {
        throw new Error('Community not found or access denied');
    }

    // Return channels in that community
    return await Channel.find({ communityId }).sort({ createdAt: 1 });
};

exports.deleteChannel = async (channelId, userId) => {
    const channel = await Channel.findById(channelId);
    if (!channel) throw new Error('Channel not found');

    const canDelete = await _hasCommunityPermission(channel.communityId, userId, 'manage_channels');
    if (!canDelete) {
        throw new Error('Insufficient permissions to delete channels');
    }

    // Delete the channel
    await Channel.findByIdAndDelete(channelId);

    // Remove from community reference
    await Community.findByIdAndUpdate(channel.communityId, {
        $pull: { channels: channelId }
    });

    return true;
};
