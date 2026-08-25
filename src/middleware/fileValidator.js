const fs = require('fs');
const path = require('path');

/**
 * Magic number signatures for allowed file types.
 * Each entry maps a human-readable name to:
 *   - offset: byte position where the signature starts
 *   - bytes: the expected byte sequence (as a Buffer)
 *   - mimeTypes: array of MIME types this signature covers
 *
 * Some formats (ZIP-based: DOCX, XLSX) share the same magic number.
 */
const SIGNATURES = [
  // Images
  { name: 'PNG',  offset: 0, bytes: Buffer.from([0x89, 0x50, 0x4E, 0x47]), mimeTypes: ['image/png'] },
  { name: 'JPEG', offset: 0, bytes: Buffer.from([0xFF, 0xD8, 0xFF]),       mimeTypes: ['image/jpeg'] },
  { name: 'GIF',  offset: 0, bytes: Buffer.from([0x47, 0x49, 0x46, 0x38]), mimeTypes: ['image/gif'] },
  { name: 'WEBP', offset: 8, bytes: Buffer.from([0x57, 0x45, 0x42, 0x50]), mimeTypes: ['image/webp'] },

  // Documents
  { name: 'PDF',  offset: 0, bytes: Buffer.from([0x25, 0x50, 0x44, 0x46]), mimeTypes: ['application/pdf'] },

  // ZIP-based (DOCX, XLSX, plain ZIP)
  {
    name: 'ZIP',
    offset: 0,
    bytes: Buffer.from([0x50, 0x4B, 0x03, 0x04]),
    mimeTypes: [
      'application/zip',
      'application/x-zip-compressed',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
  },

  // RAR archive
  { name: 'RAR', offset: 0, bytes: Buffer.from([0x52, 0x61, 0x72, 0x21]), mimeTypes: ['application/x-rar-compressed'] },

  // Videos & Containers
  { name: 'MP4/MOV', offset: 4, bytes: Buffer.from([0x66, 0x74, 0x79, 0x70]), mimeTypes: ['video/mp4', 'video/quicktime', 'video/x-m4v'] },
  { name: 'WEBM',    offset: 0, bytes: Buffer.from([0x1A, 0x45, 0xDF, 0xA3]), mimeTypes: ['video/webm', 'audio/webm'] },
  { name: 'MKV',     offset: 0, bytes: Buffer.from([0x1A, 0x45, 0xDF, 0xA3]), mimeTypes: ['video/x-matroska'] },
  { name: 'AVI',     offset: 8, bytes: Buffer.from([0x41, 0x56, 0x49, 0x20]), mimeTypes: ['video/x-msvideo', 'video/avi'] },

  // Audio
  { name: 'OGG',     offset: 0, bytes: Buffer.from([0x4F, 0x67, 0x67, 0x53]), mimeTypes: ['audio/ogg'] },
  { name: 'ID3/MP3', offset: 0, bytes: Buffer.from([0x49, 0x44, 0x33]),       mimeTypes: ['audio/mp3', 'audio/mpeg'] },
  { name: 'MP3-FB',  offset: 0, bytes: Buffer.from([0xFF, 0xFB]),             mimeTypes: ['audio/mp3', 'audio/mpeg'] },
  { name: 'WAV',     offset: 8, bytes: Buffer.from([0x57, 0x41, 0x56, 0x45]), mimeTypes: ['audio/wav'] },
];

// MIME types that are exempt from magic number checks (text, markup, SVG, complex containers)
const EXEMPT_MIME_TYPES = [
  'text/plain',
  'text/html',
  'text/css',
  'text/csv',
  'image/svg+xml',
  'audio/webm',
  'video/webm',
];

/**
 * Middleware that validates uploaded file content against its declared MIME type
 * by checking magic number (file signature) bytes.
 *
 * Must be used AFTER multer middleware (req.file must exist).
 * If validation fails, the file is deleted from disk and a 400 response is returned.
 */
const fileValidator = async (req, res, next) => {
  // If no file was uploaded, skip validation (the controller will handle the missing file)
  if (!req.file) {
    return next();
  }

  const { mimetype, path: filePath } = req.file;

  // Skip validation for exempt types
  if (EXEMPT_MIME_TYPES.includes(mimetype)) {
    return next();
  }

  try {
    // Read the first 12 bytes of the file (enough for all signatures)
    const fd = fs.openSync(filePath, 'r');
    const headerBuffer = Buffer.alloc(12);
    fs.readSync(fd, headerBuffer, 0, 12, 0);
    fs.closeSync(fd);

    // Find a matching signature for the declared MIME type
    let isValid = false;

    for (const sig of SIGNATURES) {
      // Check if this signature covers the declared MIME type
      if (!sig.mimeTypes.includes(mimetype)) continue;

      // Extract the relevant bytes from the header
      const slice = headerBuffer.slice(sig.offset, sig.offset + sig.bytes.length);

      if (slice.length >= sig.bytes.length && sig.bytes.equals(slice)) {
        isValid = true;
        break;
      }
    }

    if (!isValid) {
      // Delete the suspicious file
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkErr) {
        console.error('[FileValidator] Error deleting invalid file:', unlinkErr.message);
      }

      console.warn(`[FileValidator] Rejected file: declared ${mimetype} but magic bytes don't match`);
      return res.status(400).json({
        success: false,
        message: 'File content does not match its declared type. Upload rejected.',
      });
    }

    next();
  } catch (err) {
    console.error('[FileValidator] Error validating file:', err.message);
    // On error, still allow through — don't block uploads due to validation bugs
    next();
  }
};

module.exports = fileValidator;
