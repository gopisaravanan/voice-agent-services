/**
 * Environment variable validation and configuration
 * Validates all required environment variables at startup
 */

const logger = require('./logger');

const requiredEnvVars = [
  'OPENAI_API_KEY',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS'
];

const optionalEnvVars = {
  NODE_ENV: 'development',
  PORT: '5000',
  FRONTEND_URL: 'http://localhost:5173'
};

function validateEnv() {
  const missing = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Set defaults for optional variables
  for (const [key, defaultValue] of Object.entries(optionalEnvVars)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
      logger.info(`Using default value for ${key}: ${defaultValue}`);
    }
  }

  logger.info('Environment variables validated successfully');
}

function getConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
    port: parseInt(process.env.PORT, 10),
    frontendUrl: process.env.FRONTEND_URL,
    openai: {
      apiKey: process.env.OPENAI_API_KEY
    },
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };
}

module.exports = {
  validateEnv,
  getConfig
};
