const crypto = require('crypto');
const { createRedisConnection } = require('../config/redis');
const UserSuspension = require('../models/UserSuspension');

/**
 * Abuse detection and auto-suspension service.
 *
 * Tracks:
 *   1. Repeat rate-limit violations  → auto-suspend after 3 violations in 10 min
 *   2. Duplicate content flooding    → auto-suspend after 5 identical messages across chats in 2 min
 *
 * Redis keys:
 *   suspended:<userId>         → TTL key, present = user is suspended
 *   rateviolation:<userId>     → counter with 10-min TTL
 *   msghash:<userId>:<hash>    → counter with 2-min TTL
 *   suspcount:<userId>         → escalating suspension count (24h TTL)
 *
 * Falls back gracefully if Redis is unavailable.
 */

const SUSPENDED_PREFIX = 'suspended:';
const RATE_VIOLATION_PREFIX = 'rateviolation:';
const MSG_HASH_PREFIX = 'msghash:';
const SUSP_COUNT_PREFIX = 'suspcount:';

// Thresholds
const RATE_VIOLATION_THRESHOLD = 3;      // violations before suspension
const RATE_VIOLATION_WINDOW = 600;       // 10 minutes
const DUPLICATE_THRESHOLD = 5;           // identical messages before suspension
const DUPLICATE_WINDOW = 120;            // 2 minutes
const BASE_SUSPEND_DURATION = 300;       // 5 minutes (first offense)
const ESCALATION_MULTIPLIER = 3;         // 5 min → 15 min → 45 min
const ESCALATION_TTL = 86400;            // 24h before suspension count resets

let redis = null;
let redisAvailable = false;

/**
 * Lazily initialize Redis connection.
 */
const getRedis = () => {
  if (!redis) {
    try {
      redis = createRedisConnection();
      redis.on('connect', () => { redisAvailable = true; });
      redis.on('error', () => { redisAvailable = false; });
      redis.on('close', () => { redisAvailable = false; });
    } catch (err) {
      console.warn('[AbuseService] Redis unavailable:', err.message);
      return null;
    }
  }
  return redisAvailable ? redis : null;
};

/**
 * Check if a user is currently suspended.
 * @returns {{ suspended: boolean, remainingSeconds: number }}
 */
const isSuspended = async (userId) => {
  const client = getRedis();
  if (!client) return { suspended: false, remainingSeconds: 0 };

  try {
    const key = SUSPENDED_PREFIX + userId;
    const ttl = await client.ttl(key);
    if (ttl > 0) {
      return { suspended: true, remainingSeconds: ttl };
    }
    return { suspended: false, remainingSeconds: 0 };
  } catch (err) {
    console.error('[AbuseService] isSuspended error:', err.message);
    return { suspended: false, remainingSeconds: 0 };
  }
};

/**
 * Suspend a user for a calculated duration (escalating).
 */
const suspendUser = async (userId, reason) => {
  const client = getRedis();
  if (!client) return;

  try {
    // Get current suspension count for escalation
    const countKey = SUSP_COUNT_PREFIX + userId;
    const count = await client.incr(countKey);
    if (count === 1) {
      await client.expire(countKey, ESCALATION_TTL);
    }

    // Calculate escalating duration: 5 min → 15 min → 45 min → ...
    const duration = BASE_SUSPEND_DURATION * Math.pow(ESCALATION_MULTIPLIER, Math.min(count - 1, 3));

    // Set suspension key with TTL
    const suspKey = SUSPENDED_PREFIX + userId;
    await client.set(suspKey, reason, 'EX', Math.ceil(duration));

    // Persist to MongoDB for audit
    const expiresAt = new Date(Date.now() + duration * 1000);
    await UserSuspension.create({
      userId,
      reason,
      duration: Math.ceil(duration),
      expiresAt,
    });

    console.warn(`[AbuseService] User ${userId} suspended for ${Math.ceil(duration)}s — reason: ${reason} (offense #${count})`);
  } catch (err) {
    console.error('[AbuseService] suspendUser error:', err.message);
  }
};

/**
 * Record a rate-limit violation. If threshold is reached, auto-suspend.
 */
const recordRateLimitViolation = async (userId) => {
  const client = getRedis();
  if (!client) return;

  try {
    const key = RATE_VIOLATION_PREFIX + userId;
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, RATE_VIOLATION_WINDOW);
    }

    if (count >= RATE_VIOLATION_THRESHOLD) {
      await suspendUser(userId, 'rate_limit_repeat');
      // Reset violation counter after suspension
      await client.del(key);
    }
  } catch (err) {
    console.error('[AbuseService] recordRateLimitViolation error:', err.message);
  }
};

/**
 * Track message content hash to detect duplicate flooding.
 * Call after a message is successfully created.
 */
const trackMessageHash = async (userId, content) => {
  const client = getRedis();
  if (!client) return;

  try {
    // Hash the message content (normalize: lowercase + trim)
    const hash = crypto
      .createHash('md5')
      .update(content.toLowerCase().trim())
      .digest('hex');

    const key = MSG_HASH_PREFIX + userId + ':' + hash;
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, DUPLICATE_WINDOW);
    }

    if (count >= DUPLICATE_THRESHOLD) {
      await suspendUser(userId, 'content_flooding');
      // Reset hash counter after suspension
      await client.del(key);
    }
  } catch (err) {
    console.error('[AbuseService] trackMessageHash error:', err.message);
  }
};

module.exports = {
  isSuspended,
  suspendUser,
  recordRateLimitViolation,
  trackMessageHash,
};
