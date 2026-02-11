/**
 * Created by AI Assistant (Senior Dev Mode)
 * File: health.js
 * Description: Health check endpoint to verify API configuration
 */

const express = require('express');
const router = express.Router();
const { verifyEmailConfig } = require('../services/email.service');

router.get('/', async (req, res) => {
  try {
    const checks = {
      server: 'running',
      timestamp: new Date().toISOString(),
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

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      ...checks
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

module.exports = router;
