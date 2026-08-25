const { validationResult } = require('express-validator');

/**
 * Middleware that checks express-validator results.
 * If validation errors exist, responds with 400 and the first error message.
 * Otherwise, calls next().
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

module.exports = handleValidationErrors;
