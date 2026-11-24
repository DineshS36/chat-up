const { body, param, query } = require('express-validator');

// ─── Reusable Validators ──────────────────────────────────────────

/** Validates that a field is a valid 24-char hex MongoDB ObjectId */
const objectId = (field, location = 'body') => {
  const chain = location === 'param' ? param(field) : body(field);
  return chain
    .trim()
    .notEmpty().withMessage(`${field} is required`)
    .isMongoId().withMessage(`${field} must be a valid ID`);
};

/** Validates a required non-empty trimmed string with max length */
const requiredString = (field, maxLength = 5000) => {
  return body(field)
    .trim()
    .notEmpty().withMessage(`${field} is required`)
    .isString().withMessage(`${field} must be a string`)
    .isLength({ max: maxLength }).withMessage(`${field} must be at most ${maxLength} characters`);
};

/** Validates an optional trimmed string with max length */
const optionalString = (field, maxLength = 500) => {
  return body(field)
    .optional()
    .trim()
    .isString().withMessage(`${field} must be a string`)
    .isLength({ max: maxLength }).withMessage(`${field} must be at most ${maxLength} characters`);
};

// ─── Chat Route Validators ────────────────────────────────────────

const createChat = [
  objectId('userId'),
];

const createGroupChat = [
  requiredString('name', 100),
  body('participants')
    .isArray({ min: 1 }).withMessage('participants must be an array with at least 1 member'),
  body('participants.*')
    .trim()
    .isMongoId().withMessage('Each participant must be a valid ID'),
];

const addToGroup = [
  objectId('userId'),
  objectId('id', 'param'),
];

const removeFromGroup = [
  objectId('userId'),
  objectId('id', 'param'),
];

const pinMessage = [
  objectId('messageId'),
  objectId('chatId', 'param'),
];

const unpinMessage = [
  objectId('chatId', 'param'),
  objectId('messageId', 'param'),
];

const markChatAsRead = [
  objectId('chatId', 'param'),
];

const leaveGroup = [
  objectId('id', 'param'),
];

const getChatsByUserId = [
  objectId('userId', 'param'),
];

const getChat = [
  objectId('id', 'param'),
];

// ─── Message Route Validators ─────────────────────────────────────

const sendMessage = [
  objectId('chatId'),
  objectId('receiverId'),
  requiredString('content', 5000),
  body('replyTo').optional().isMongoId().withMessage('replyTo must be a valid ID'),
];

const editMessage = [
  objectId('id', 'param'),
  requiredString('content', 5000),
];

const deleteMessageValidator = [
  objectId('id', 'param'),
];

const reactToMessage = [
  objectId('id', 'param'),
  requiredString('emoji', 20),
];

const uploadFile = [
  objectId('chatId'),
  objectId('receiverId'),
];

const forwardMessage = [
  objectId('messageId'),
  objectId('targetChatId'),
];

const scheduleMessage = [
  objectId('chatId'),
  objectId('receiverId'),
  requiredString('content', 5000),
  body('scheduledTime')
    .notEmpty().withMessage('scheduledTime is required')
    .isISO8601().withMessage('scheduledTime must be a valid ISO 8601 date'),
  body('replyTo').optional().isMongoId().withMessage('replyTo must be a valid ID'),
];

const searchMessages = [
  objectId('chatId', 'param'),
  query('query')
    .trim()
    .notEmpty().withMessage('Search query is required')
    .isString().withMessage('Search query must be a string')
    .isLength({ max: 200 }).withMessage('Search query must be at most 200 characters'),
];

const getMessages = [
  objectId('chatId', 'param'),
  query('before')
    .optional()
    .isMongoId().withMessage('before must be a valid message ID'),
  query('after')
    .optional()
    .isMongoId().withMessage('after must be a valid message ID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

const markAsRead = [
  objectId('chatId', 'param'),
];

// ─── Community Validators ─────────────────────────────────────────

const createCommunity = [
  requiredString('name', 100),
  optionalString('description', 500),
  optionalString('avatar', 500),
  body('isPrivate').optional().isBoolean().withMessage('isPrivate must be a boolean'),
];

// ─── Channel Validators ──────────────────────────────────────────

const createChannel = [
  objectId('communityId'),
  requiredString('name', 100),
  body('type')
    .optional()
    .isIn(['text', 'voice']).withMessage('type must be either "text" or "voice"'),
];

const getChannels = [
  objectId('communityId', 'param'),
];

const deleteChannel = [
  objectId('id', 'param'),
];

// ─── Invite Validators ───────────────────────────────────────────

const createInvite = [
  objectId('communityId'),
  body('maxUses')
    .optional()
    .isInt({ min: 1 }).withMessage('maxUses must be an integer >= 1'),
  body('expiresInDays')
    .optional()
    .isInt({ min: 1, max: 365 }).withMessage('expiresInDays must be between 1 and 365'),
];

const validateInviteCode = [
  param('code')
    .trim()
    .notEmpty().withMessage('Invite code is required')
    .isAlphanumeric().withMessage('Invite code must be alphanumeric')
    .isLength({ min: 6, max: 20 }).withMessage('Invalid invite code length'),
];

// ─── Story Validators ────────────────────────────────────────────

const createStory = [
  optionalString('caption', 200),
  body('type')
    .optional()
    .isIn(['image', 'video']).withMessage('type must be either "image" or "video"'),
  optionalString('mediaUrl', 1000),
];

const viewStory = [
  objectId('id', 'param'),
];

// ─── Backup Validators ──────────────────────────────────────────

const exportChat = [
  objectId('chatId', 'param'),
  query('format')
    .optional()
    .isIn(['json', 'txt']).withMessage('format must be either "json" or "txt"'),
];

module.exports = {
  // Chat
  createChat,
  createGroupChat,
  addToGroup,
  removeFromGroup,
  pinMessage,
  unpinMessage,
  markChatAsRead,
  leaveGroup,
  getChatsByUserId,
  getChat,

  // Messages
  sendMessage,
  editMessage,
  deleteMessage: deleteMessageValidator,
  reactToMessage,
  uploadFile,
  forwardMessage,
  scheduleMessage,
  searchMessages,
  getMessages,
  markAsRead,

  // Community
  createCommunity,

  // Channel
  createChannel,
  getChannels,
  deleteChannel,

  // Invite
  createInvite,
  validateInviteCode,

  // Story
  createStory,
  viewStory,

  // Backup
  exportChat,
};
