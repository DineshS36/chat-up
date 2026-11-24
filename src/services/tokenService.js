const crypto = require('crypto');
const { createRedisConnection } = require('../config/redis');

/**
 * Token blacklist service using Redis.
 * Stores SHA-256 hashes of revoked JWTs with TTL matching the token's remaining lifetime.
 * Falls back gracefully if Redis is unavailable — tokens simply won't be blacklisted.
 */

const PREFIX = 'blacklist:';
let redis = null;

/**
 * Lazily initialize Redis connection.
 * Shared connection for all token operations.
 */
const getRedis = () => {
  if (!redis) {
    try {
      redis = createRedisConnection();
      redis.on('error', () => {
        // Errors are already logged by the shared redis config
      });
    } catch (err) {
      console.warn('[TokenService] Could not create Redis connection:', err.message);
      return null;
    }
  }
  return redis;
};

/**
 * Hash a JWT token using SHA-256.
 * We never store raw tokens in Redis.
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Add a token to the blacklist.
 * @param {string} token - The raw JWT string
 * @param {number} expiresInSeconds - TTL for the blacklist entry (should match token's remaining lifetime)
 */
const blacklistToken = async (token, expiresInSeconds) => {
  const client = getRedis();
  if (!client) {
    console.warn('[TokenService] Redis unavailable — token not blacklisted');
    return false;
  }

  try {
    const key = PREFIX + hashToken(token);
    // Set with TTL so entries auto-expire when the token would have expired anyway
    await client.set(key, '1', 'EX', Math.max(1, Math.ceil(expiresInSeconds)));
    return true;
  } catch (err) {
    console.error('[TokenService] Error blacklisting token:', err.message);
    return false;
  }
};

/**
 * Check if a token has been blacklisted.
 * @param {string} token - The raw JWT string
 * @returns {boolean} true if blacklisted, false otherwise (including Redis failures)
 */
const isTokenBlacklisted = async (token) => {
  const client = getRedis();
  if (!client) {
    // If Redis is down, we can't check — allow the token through
    return false;
  }

  try {
    const key = PREFIX + hashToken(token);
    const result = await client.exists(key);
    return result === 1;
  } catch (err) {
    console.error('[TokenService] Error checking blacklist:', err.message);
    return false; // Fail open — don't break auth if Redis is down
  }
};

module.exports = { blacklistToken, isTokenBlacklisted };
