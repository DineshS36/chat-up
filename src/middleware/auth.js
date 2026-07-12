const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      const error = new Error('Not authorized, no token');
      error.status = 401;
      throw error;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      next();
    } catch (err) {
      const error = new Error('Not authorized, token failed');
      error.status = 401;
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

module.exports = auth;