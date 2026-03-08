const User = require('../models/User');

// @desc    Get all users (excluding current user)
// @route   GET /api/users
// @access  Private
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find({ _id: { $ne: req.userId } })
            .select('name email profilePic status');

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        next(error);
    }
};
