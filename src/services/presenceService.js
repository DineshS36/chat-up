const { createRedisConnection } = require('../config/redis');

/**
 * Presence tracking service using Redis.
 * Replaces in-memory onlineUsers and messageRateMap for multi-instance support.
 *
 * Redis data structures:
 *   presence:<userId>  → Hash { socketId: timestamp }
 *   rate:<userId>      → String (count), with TTL = rate window
 *
 * Falls back to in-memory Maps if Redis is unavailable.
 */

const PRESENCE_PREFIX = 'presence:';
const RATE_PREFIX = 'rate:';
const STALE_THRESHOLD = 60000; // 60 seconds
const MSG_RATE_LIMIT = 30;
const MSG_RATE_WINDOW = 60; // seconds

// ─── In-Memory Fallbacks ──────────────────────────────────────────
const memoryOnlineUsers = new Map();
const memoryRateMap = new Map();

let redis = null;
let redisAvailable = false;

/**
 * Initialize Redis connection for presence.
 * Call once during server startup.
 */
const init = () => {
  try {
    redis = createRedisConnection();

    redis.on('connect', () => {
      redisAvailable = true;
    });

    redis.on('error', () => {
      redisAvailable = false;
    });

    redis.on('close', () => {
      redisAvailable = false;
    });
  } catch (err) {
    console.warn('[Presence] Redis unavailable — using in-memory fallback:', err.message);
    redisAvailable = false;
  }
};

// ─── Socket Registration ──────────────────────────────────────────

const addSocket = async (userId, socketId) => {
  if (redisAvailable) {
    try {
      await redis.hset(PRESENCE_PREFIX + userId, socketId, Date.now().toString());
      return;
    } catch (err) {
      console.error('[Presence] Redis addSocket error:', err.message);
    }
  }
  // Fallback
  let entry = memoryOnlineUsers.get(userId);
  if (!entry) {
    entry = { socketIds: new Set(), lastSeen: Date.now() };
    memoryOnlineUsers.set(userId, entry);
  }
  entry.socketIds.add(socketId);
  entry.lastSeen = Date.now();
};

const removeSocket = async (userId, socketId) => {
  if (redisAvailable) {
    try {
      await redis.hdel(PRESENCE_PREFIX + userId, socketId);
      // Clean up key if no sockets remain
      const remaining = await redis.hlen(PRESENCE_PREFIX + userId);
      if (remaining === 0) {
        await redis.del(PRESENCE_PREFIX + userId);
      }
      return remaining;
    } catch (err) {
      console.error('[Presence] Redis removeSocket error:', err.message);
    }
  }
  // Fallback
  const entry = memoryOnlineUsers.get(userId);
  if (entry) {
    entry.socketIds.delete(socketId);
    if (entry.socketIds.size === 0) {
      memoryOnlineUsers.delete(userId);
      return 0;
    }
    return entry.socketIds.size;
  }
  return 0;
};

// ─── Socket Queries ───────────────────────────────────────────────

const getSocketIds = async (userId) => {
  if (redisAvailable) {
    try {
      const hash = await redis.hgetall(PRESENCE_PREFIX + userId);
      return Object.keys(hash || {});
    } catch (err) {
      console.error('[Presence] Redis getSocketIds error:', err.message);
    }
  }
  // Fallback
  const entry = memoryOnlineUsers.get(userId);
  return entry ? [...entry.socketIds] : [];
};

const isOnline = async (userId) => {
  if (redisAvailable) {
    try {
      const count = await redis.hlen(PRESENCE_PREFIX + userId);
      return count > 0;
    } catch (err) {
      console.error('[Presence] Redis isOnline error:', err.message);
    }
  }
  return memoryOnlineUsers.has(userId);
};

// ─── Heartbeat ────────────────────────────────────────────────────

const updateHeartbeat = async (userId, socketId) => {
  if (redisAvailable) {
    try {
      await redis.hset(PRESENCE_PREFIX + userId, socketId, Date.now().toString());
      return;
    } catch (err) {
      console.error('[Presence] Redis heartbeat error:', err.message);
    }
  }
  // Fallback
  const entry = memoryOnlineUsers.get(userId);
  if (entry && entry.socketIds.has(socketId)) {
    entry.lastSeen = Date.now();
  }
};

// ─── Stale Cleanup ────────────────────────────────────────────────

/**
 * Returns an array of { userId, socketId } entries that are stale.
 */
const getStaleEntries = async () => {
  const stale = [];
  const now = Date.now();

  if (redisAvailable) {
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', PRESENCE_PREFIX + '*', 'COUNT', 100);
        cursor = nextCursor;

        for (const key of keys) {
          const userId = key.replace(PRESENCE_PREFIX, '');
          const hash = await redis.hgetall(key);
          let allStale = true;

          for (const [socketId, timestamp] of Object.entries(hash)) {
            if (now - parseInt(timestamp, 10) > STALE_THRESHOLD) {
              stale.push({ userId, socketId });
            } else {
              allStale = false;
            }
          }

          // If all sockets for this user are stale, mark entire user
          if (allStale && Object.keys(hash).length > 0) {
            // Remove all stale sockets at once
            await redis.del(key);
          } else {
            // Remove only stale sockets
            for (const entry of stale.filter(e => e.userId === userId)) {
              await redis.hdel(key, entry.socketId);
            }
          }
        }
      } while (cursor !== '0');

      return stale;
    } catch (err) {
      console.error('[Presence] Redis stale cleanup error:', err.message);
    }
  }

  // Fallback: in-memory cleanup
  for (const [userId, entry] of memoryOnlineUsers.entries()) {
    if (now - entry.lastSeen > STALE_THRESHOLD) {
      stale.push({ userId, socketId: null });
      memoryOnlineUsers.delete(userId);
    }
  }
  return stale;
};

// ─── Rate Limiting ────────────────────────────────────────────────

/**
 * Check and increment message rate for a user.
 * Returns true if the user is WITHIN the rate limit, false if exceeded.
 */
const checkRate = async (userId) => {
  if (redisAvailable) {
    try {
      const key = RATE_PREFIX + userId;
      const count = await redis.incr(key);
      if (count === 1) {
        // First message in this window — set TTL
        await redis.expire(key, MSG_RATE_WINDOW);
      }
      return count <= MSG_RATE_LIMIT;
    } catch (err) {
      console.error('[Presence] Redis rate check error:', err.message);
    }
  }

  // Fallback
  const now = Date.now();
  const rate = memoryRateMap.get(userId) || { count: 0, lastReset: now };

  if (now - rate.lastReset > MSG_RATE_WINDOW * 1000) {
    rate.count = 0;
    rate.lastReset = now;
  }

  rate.count++;
  memoryRateMap.set(userId, rate);
  return rate.count <= MSG_RATE_LIMIT;
};

// ─── Emit Helper ──────────────────────────────────────────────────

/**
 * Emit an event to all sockets belonging to a specific user.
 */
const emitToUser = async (io, userId, event, data) => {
  const socketIds = await getSocketIds(userId);
  socketIds.forEach(sid => io.to(sid).emit(event, data));
};

module.exports = {
  init,
  addSocket,
  removeSocket,
  getSocketIds,
  isOnline,
  updateHeartbeat,
  getStaleEntries,
  checkRate,
  emitToUser,
  MSG_RATE_LIMIT,
};
