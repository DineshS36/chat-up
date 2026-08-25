// Load environment variables first (before any other imports)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const app = require('./app');
const connectDB = require('./config/db');
const chatSocket = require('./sockets/chatSocket');
const startMessageWorker = require('./workers/messageWorker');
const { isTokenBlacklisted } = require('./services/tokenService');
const { createRedisConnection } = require('./config/redis');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Socket.IO CORS whitelist (same origins as Express)
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// ─── Socket.IO Redis Adapter (cross-instance event sync) ──────────
// Wrapped in try/catch — falls back to single-instance if Redis is unavailable
(async () => {
  try {
    const { createAdapter } = require('@socket.io/redis-adapter');
    const pubClient = createRedisConnection();
    const subClient = pubClient.duplicate();

    await Promise.all([
      new Promise((resolve, reject) => {
        pubClient.on('connect', resolve);
        pubClient.on('error', reject);
        // Give it 3 seconds to connect
        setTimeout(() => reject(new Error('Redis adapter connection timeout')), 3000);
      }),
      new Promise((resolve, reject) => {
        subClient.on('connect', resolve);
        subClient.on('error', reject);
        setTimeout(() => reject(new Error('Redis adapter connection timeout')), 3000);
      }),
    ]);

    io.adapter(createAdapter(pubClient, subClient));
    console.log('[Socket.IO] Redis adapter attached — multi-instance support enabled');
  } catch (err) {
    console.warn('[Socket.IO] Redis adapter unavailable — running in single-instance mode:', err.message);
  }
})();

// Socket.IO JWT authentication middleware
io.use(async (socket, next) => {
  try {
    // Extract token from auth object or Authorization header
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      console.warn(`[Socket Auth] Connection rejected — no token (${socket.id})`);
      return next(new Error('Authentication required'));
    }

    // Check if token has been revoked (logout / password change)
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      console.warn(`[Socket Auth] Connection rejected — token revoked (${socket.id})`);
      return next(new Error('Token has been revoked'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // Attach user payload to socket
    next();
  } catch (err) {
    console.warn(`[Socket Auth] Connection rejected — ${err.message} (${socket.id})`);
    return next(new Error('Invalid or expired token'));
  }
});

app.set('io', io);

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Handle socket connections and wait for it to reset user statuses
  await chatSocket(io);

  // Start BullMQ worker for reliable scheduled messages
  startMessageWorker(io);

  // Start server
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});