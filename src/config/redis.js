const Redis = require('ioredis');

/**
 * Create a shared Redis (ioredis) connection for BullMQ.
 * Reads REDIS_URL from .env, falls back to localhost:6379 for dev.
 */
const createRedisConnection = () => {
  const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

  const connection = new Redis(url, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('[Redis] Connection failed after 3 attempts. Scheduled messages will be unavailable.');
        return null; // Stop retrying
      }
      return 1000; // Retry every 1s
    }
  });

  connection.on('connect', () => {
    console.log('[Redis] Connected');
    connection.__hasLoggedError = false;
  });
  
  connection.on('error', (err) => {
    if (!connection.__hasLoggedError) {
      console.error('[Redis] Error:', err.message, '- Retrying...');
      connection.__hasLoggedError = true;
    }
  });

  return connection;
};

module.exports = { createRedisConnection };
