const communityService = require('./community.service');

// @desc    Create a new community
// @route   POST /api/communities
// @access  Private
exports.createCommunity = async (req, res, next) => {
  try {
    const { name, description, avatar, isPrivate } = req.body;

    if (!name) {
      const error = new Error('Community name is required');
      error.status = 400;
      throw error;
    }

    const community = await communityService.createCommunity({
      name,
      description,
      avatar,
      isPrivate,
      userId: req.userId
    });

    res.status(201).json({
      success: true,
      data: community
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all communities for logged-in user
// @route   GET /api/communities
// @access  Private
exports.getCommunities = async (req, res, next) => {
  try {
    const communities = await communityService.getUserCommunities(req.userId);

    res.json({
      success: true,
      count: communities.length,
      data: communities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single community
// @route   GET /api/communities/:id
// @access  Private
exports.getCommunity = async (req, res, next) => {
  try {
    const community = await communityService.getCommunityById(
      req.params.id,
      req.userId
    );

    res.json({
      success: true,
      data: community
    });
  } catch (error) {
    next(error);
  }
};
