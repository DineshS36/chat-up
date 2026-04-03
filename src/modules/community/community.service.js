const Community = require('./community.model');

/**
 * Create a new community.
 * The creator is automatically added as a member with role "owner".
 */
exports.createCommunity = async ({ name, description, avatar, isPrivate, userId }) => {
  const community = await Community.create({
    name,
    description,
    avatar,
    owner: userId,
    isPrivate: isPrivate || false,
    members: [{ user: userId, role: 'owner' }]
  });

  return Community.findById(community._id)
    .populate('owner', 'name email profilePic')
    .populate('members.user', 'name email profilePic');
};

/**
 * Get all communities the logged-in user is a member of.
 */
exports.getUserCommunities = async (userId) => {
  return Community.find({ 'members.user': userId })
    .populate('owner', 'name email profilePic')
    .populate('members.user', 'name email profilePic')
    .sort({ createdAt: -1 });
};

/**
 * Get a single community by ID.
 * Throws if not found or user is not a member.
 */
exports.getCommunityById = async (communityId, userId) => {
  const community = await Community.findById(communityId)
    .populate('owner', 'name email profilePic')
    .populate('members.user', 'name email profilePic');

  if (!community) {
    const error = new Error('Community not found');
    error.status = 404;
    throw error;
  }

  const isMember = community.members.some(
    (m) => m.user._id.toString() === userId
  );

  if (!isMember) {
    const error = new Error('Not authorized to access this community');
    error.status = 403;
    throw error;
  }

  return community;
};
