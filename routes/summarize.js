/**
 * Created by AI Assistant (Senior Dev Mode)
 * File: summarize.js
 * Description: Summarization endpoint using GPT-4o
 */

const express = require('express');
const router = express.Router();
const { summarizeTranscript, retryWithBackoff } = require('../services/openai.service');

router.post('/', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Transcript is required and must be a string' });
    }

    if (transcript.trim().length === 0) {
      return res.status(400).json({ error: 'Transcript cannot be empty' });
    }

    console.log(`Summarizing transcript (${transcript.length} characters)...`);

    // Summarize with retry logic
    const summary = await retryWithBackoff(() => summarizeTranscript(transcript));

    // Validate summary structure
    if (!summary.bullets || !Array.isArray(summary.bullets) || summary.bullets.length === 0) {
      throw new Error('Invalid summary format: missing bullets');
    }

    if (!summary.nextStep || typeof summary.nextStep !== 'string') {
      throw new Error('Invalid summary format: missing nextStep');
    }

    res.json({
      success: true,
      summary: summary,
      transcriptLength: transcript.length
    });

  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({
      error: 'Summarization failed',
      message: error.message
    });
  }
});

module.exports = router;
