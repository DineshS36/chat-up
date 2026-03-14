const Invite = require('./invite.model');
const Community = require('../community/community.model');
const crypto = require('crypto');

// Helpers for checking custom invite permissions (Can be abstracted)
const _hasInvitePermission = async (communityId, userId) => {
    const community = await Community.findById(communityId);
    if (!community) return false;
    const member = community.members.find(m => m.user.toString() === userId.toString());
    if (!member) return false;
    // For now, let all members generate invites unless strictly controlled later
    return true;
};

exports.generateInvite = async (communityId, userId, maxUses = 0, expiresInDays = 7) => {
    const canInvite = await _hasInvitePermission(communityId, userId);
    if (!canInvite) {
        throw new Error('Insufficient permissions to generate invites');
    }

    // Generate random 8-char code
    const inviteCode = crypto.randomBytes(4).toString('hex');

    let expiresAt = null;
    if (expiresInDays > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const invite = new Invite({
        inviteCode,
        communityId,
        createdBy: userId,
        expiresAt,
        maxUses
    });

    await invite.save();

    // Push explicitly to community document for structural querying
    await Community.findByIdAndUpdate(communityId, {
        $push: { inviteLinks: invite._id }
    });

    return invite;
};

exports.getInviteByCode = async (inviteCode) => {
    const invite = await Invite.findOne({ inviteCode }).populate('communityId', 'name avatar description');
    if (!invite) throw new Error('Invite link invalid or not found');

    // Check expiration and usage counts
    if (invite.expiresAt && new Date() > invite.expiresAt) {
        throw new Error('Invite link has expired');
    }

    if (invite.maxUses > 0 && invite.currentUses >= invite.maxUses) {
        throw new Error('Invite link has reached its maximum usage limit');
    }

    return invite;
};

exports.consumeInvite = async (inviteCode, userId) => {
    // 1. Verify link is valid
    const invite = await this.getInviteByCode(inviteCode);
    const community = await Community.findById(invite.communityId);

    // 2. Prevent Double Joining
    const alreadyMember = community.members.some(m => m.user.toString() === userId.toString());
    if (alreadyMember) {
        throw new Error('You are already a member of this community');
    }

    // 3. Atomically consume invite uses via incrementing
    const updatedInvite = await Invite.findOneAndUpdate(
        { _id: invite._id, $expr: { $or: [{ $eq: ["$maxUses", 0] }, { $lt: ["$currentUses", "$maxUses"] }] } },
        { $inc: { currentUses: 1 } },
        { new: true }
    );

    if (!updatedInvite && invite.maxUses !== 0) {
        throw new Error('Invite link reached maximum uses just now');
    }

    // 4. Update core Community Members array to graft the user
    community.members.push({
        user: userId,
        role: 'Member'
    });

    await community.save();

    return community;
};
