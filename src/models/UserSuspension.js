const mongoose = require('mongoose');

/**
 * Tracks user suspension history for audit and admin review.
 * Auto-suspensions from the abuse detection system are recorded here.
 */
const userSuspensionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    enum: ['rate_limit_repeat', 'content_flooding'],
    required: true,
  },
  duration: {
    type: Number, // seconds
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Fast lookup: recent suspensions for a user
userSuspensionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('UserSuspension', userSuspensionSchema);
