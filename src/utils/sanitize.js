/**
 * Sanitize and validate common user inputs.
 * Provides XSS protection and type enforcement.
 */

/**
 * Strip HTML tags from a string to prevent stored XSS.
 * Preserves the text content but removes all <tags>.
 */
const stripHtmlTags = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '');
};

/**
 * Sanitize a message content string:
 * - Ensures it's a string
 * - Strips HTML tags
 * - Trims whitespace
 * - Enforces max length
 */
const sanitizeMessageContent = (content, maxLength = 5000) => {
  if (typeof content !== 'string') return '';
  let sanitized = stripHtmlTags(content).trim();
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
};

/**
 * Validate and cast a value to a plain string.
 * Returns null if the input is not a string or is empty after trimming.
 */
const toSafeString = (value) => {
  if (typeof value !== 'string') return null;
  return value.trim() || null;
};

/**
 * Validate that a string looks like a MongoDB ObjectId (24 hex chars).
 */
const isValidObjectId = (str) => {
  return typeof str === 'string' && /^[0-9a-fA-F]{24}$/.test(str);
};

module.exports = {
  stripHtmlTags,
  sanitizeMessageContent,
  toSafeString,
  isValidObjectId,
};
