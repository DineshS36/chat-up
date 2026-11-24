const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { blacklistToken } = require('../services/tokenService');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      const error = new Error('Please provide name, email, and password');
      error.status = 400;
      throw error;
    }

    // FIX #3: Guard against NoSQL injection — ensure inputs are plain strings
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      const error = new Error('Invalid input types');
      error.status = 400;
      throw error;
    }

    // Check if email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      const error = new Error('User already exists with this email');
      error.status = 400;
      throw error;
    }

    // Create new user (password is hashed via pre-save hook)
    const user = await User.create({ name, email, password });

    // Return user data and token
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        status: user.status,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      const error = new Error('Please provide email and password');
      error.status = 400;
      throw error;
    }

    // FIX #3: Guard against NoSQL injection — ensure inputs are plain strings
    if (typeof email !== 'string' || typeof password !== 'string') {
      const error = new Error('Invalid input types');
      error.status = 400;
      throw error;
    }

    // Check if user exists and get password
    const user = await User.findOne({ email: String(email) }).select('+password');

    if (!user) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    // Update user status to online (use updateOne to avoid triggering pre-save hook)
    await User.updateOne({ _id: user._id }, { status: 'online' });

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        status: 'online'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user (revoke token server-side)
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res, next) => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      // Decode to get expiration time
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        // Calculate remaining TTL in seconds
        const remainingTTL = decoded.exp - Math.floor(Date.now() / 1000);
        if (remainingTTL > 0) {
          await blacklistToken(token, remainingTTL);
        }
      }
    }

    // Update user status to offline
    await User.updateOne({ _id: req.userId }, {
      status: 'offline',
      lastSeen: new Date()
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser, logoutUser };