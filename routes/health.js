/**
 * Health check endpoint to verify API configuration
 */

const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const { verifyEmailConfig } = require('../services/email.service');

router.get('/', async (req, res) => {
  try {
    const checks = {
      server: 'running',
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
    };

    // Optional: Verify email configuration
    if (checks.smtpConfigured) {
      try {
        checks.emailVerified = await verifyEmailConfig();
      } catch (error) {
        checks.emailVerified = false;
        checks.emailError = error.message;
      }
    }

    const allHealthy = checks.openaiConfigured && checks.smtpConfigured;

    logger.debug('Health check performed', { status: allHealthy ? 'healthy' : 'degraded' });

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      ...checks
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

module.exports = router;
