/**
 * Transcription endpoint using OpenAI Whisper
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { transcribeAudio, retryWithBackoff } = require('../services/openai.service');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit (Whisper's limit)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(webm|wav|mp3|ogg)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

router.post('/', uploadLimiter, upload.single('audio'), async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    filePath = req.file.path;
    logger.info('Audio file received', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Transcribe with retry logic
    const transcript = await retryWithBackoff(() => transcribeAudio(filePath));

    res.json({
      success: true,
      transcript: transcript,
      fileSize: req.file.size
    });

  } catch (error) {
    logger.error('Transcription request failed', { 
      error: error.message,
      filename: req.file?.originalname 
    });
    res.status(500).json({
      error: 'Transcription failed',
      message: error.message
    });
  } finally {
    // Clean up uploaded file
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        logger.debug('Cleaned up temporary file', { filePath });
      } catch (cleanupError) {
        logger.error('Failed to cleanup file', { 
          error: cleanupError.message,
          filePath 
        });
      }
    }
  }
});

module.exports = router;
