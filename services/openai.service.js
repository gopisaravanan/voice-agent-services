const OpenAI = require('openai');
const fs = require('fs');
const logger = require('../config/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Transcribe audio file using OpenAI Whisper
 * @param {string} audioFilePath - Path to the audio file
 * @returns {Promise<string>} - Transcribed text
 */
async function transcribeAudio(audioFilePath) {
  try {
    logger.info('Starting audio transcription');
    
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
      language: 'en'
    });

    logger.info('Transcription completed successfully');
    return transcription.text;
  } catch (error) {
    logger.error('Whisper transcription failed', { 
      error: error.message,
      filePath: audioFilePath 
    });
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

/**
 * Summarize transcript using GPT-4o
 * @param {string} transcript - The transcribed text
 * @returns {Promise<Object>} - Summary object with bullets and nextStep
 */
async function summarizeTranscript(transcript) {
  try {
    logger.info('Starting transcript summarization', { 
      transcriptLength: transcript.length 
    });
    
    const prompt = `You are a conversation summarizer. Given a transcript, create a concise summary with:
1. Exactly 5 bullet points capturing the key topics, decisions, and important details discussed
2. One clear next step or action item

Format your response as JSON:
{
  "bullets": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "nextStep": "Clear action item"
}

Keep it professional, concise, and actionable. Always provide exactly 5 bullet points to give a comprehensive overview.

Transcript:
${transcript}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes conversations into exactly 5 clear, actionable bullet points with a next step.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500
    });

    const summaryText = completion.choices[0].message.content;
    const summary = JSON.parse(summaryText);

    logger.info('Summary generated successfully', {
      bulletCount: summary.bullets?.length
    });
    return summary;
  } catch (error) {
    logger.error('GPT-4o summarization failed', { 
      error: error.message 
    });
    throw new Error(`Summarization failed: ${error.message}`);
  }
}

/**
 * Retry wrapper for API calls with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<any>} - Result of the function
 */
async function retryWithBackoff(fn, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (error.status === 429) {
        const delay = Math.pow(2, attempt) * 1000;
        logger.warn('Rate limited, retrying', { 
          attempt: attempt + 1, 
          delay 
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  
  throw lastError;
}

module.exports = {
  transcribeAudio,
  summarizeTranscript,
  retryWithBackoff
};
