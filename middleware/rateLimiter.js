/**
 * Rate limiting middleware to prevent abuse
 */

const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiter for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 uploads per windowMs
  message: 'Too many upload requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Email sending rate limiter
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 emails per hour
  message: 'Too many email requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  uploadLimiter,
  emailLimiter
};
