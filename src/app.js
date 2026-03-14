const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const storyRoutes = require('./routes/storyRoutes');
const errorHandler = require('./middleware/errorHandler');

// Stage 2: Modular Features
const communityRoutes = require('./modules/community/community.routes');
const channelRoutes = require('./modules/channel/channel.routes');
const inviteRoutes = require('./modules/invite/invite.routes');
const backupRoutes = require('./modules/backup/backup.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stories', storyRoutes);

// Stage 2: Modular API Routes
app.use('/api/communities', communityRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/backup', backupRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;