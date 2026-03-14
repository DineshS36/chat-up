const Community = require('./community.model');
const Channel = require('../channel/channel.model');

exports.createCommunity = async (userId, name, description, avatar) => {
    // 1. Create the community document
    const community = new Community({
        name,
        description,
        avatar,
        owner: userId,
        members: [{
            user: userId,
            role: 'Owner'
        }]
    });

    await community.save();

    // 2. Automatically generate a 'general' text channel
    const defaultChannel = new Channel({
        communityId: community._id,
        name: 'general',
        type: 'text'
    });

    await defaultChannel.save();

    // 3. Link default channel to community
    community.channels.push(defaultChannel._id);
    await community.save();

    return community.populate('channels');
};

exports.getUserCommunities = async (userId) => {
    // Return all communities where the user is listed in members array
    return await Community.find({ "members.user": userId })
        .populate('channels')
        .sort({ createdAt: -1 });
};

exports.getCommunityById = async (communityId, userId) => {
    // Ensure the requester is actually a member
    const community = await Community.findOne({
        _id: communityId,
        "members.user": userId
    }).populate('channels')
        .populate('members.user', 'name email avatar isOnline lastSeen');

    if (!community) {
        throw new Error('Community not found or access denied');
    }
    return community;
};

exports.deleteCommunity = async (communityId, userId) => {
    const community = await Community.findById(communityId);
    if (!community) throw new Error('Community not found');

    if (community.owner.toString() !== userId.toString()) {
        throw new Error('Only the owner can delete the community');
    }

    // Delete associated channels
    await Channel.deleteMany({ communityId: community._id });

    // Delete the community itself
    await Community.findByIdAndDelete(communityId);
    return true;
};
