/**
 * Created by AI Assistant (Senior Dev Mode)
 * File: email.js
 * Description: Email sending endpoint with scheduling support
 */

const express = require('express');
const router = express.Router();
const { sendEmail, scheduleEmail } = require('../services/email.service');

router.post('/', async (req, res) => {
  try {
    const { email, summary, transcript, scheduleOption } = req.body;

    // Validate inputs
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email address is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }

    if (!summary || !summary.bullets || !summary.nextStep) {
      return res.status(400).json({ error: 'Summary is required with bullets and nextStep' });
    }

    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    // Handle instant or scheduled sending
    if (scheduleOption && scheduleOption !== 'instant') {
      // Schedule email
      const result = scheduleEmail(email, summary, transcript, scheduleOption);
      
      res.json({
        success: true,
        scheduled: true,
        scheduledTime: result.scheduledTime,
        delay: result.delay,
        message: `Email scheduled to be sent in ${result.delay}`
      });
    } else {
      // Send immediately
      const result = await sendEmail(email, summary, transcript);
      
      res.json({
        success: true,
        scheduled: false,
        messageId: result.messageId,
        timestamp: result.timestamp,
        message: 'Email sent successfully'
      });
    }

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({
      error: 'Failed to send email',
      message: error.message
    });
  }
});

module.exports = router;
