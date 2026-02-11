const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Initialize logger and config
const logger = require('./config/logger');
const { validateEnv, getConfig } = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimiter');

// Validate environment variables (but don't exit in serverless)
try {
  validateEnv();
} catch (error) {
  console.error('Environment validation failed:', error.message);
  // In Vercel, log error but continue - environment vars might be set differently
  if (process.env.VERCEL !== '1') {
    process.exit(1);
  }
}

const config = getConfig();
const app = express();
const PORT = config.port;

// Create necessary directories (skip in Vercel serverless - use /tmp instead)
if (process.env.VERCEL !== '1') {
  const uploadsDir = path.join(__dirname, 'uploads');
  const logsDir = path.join(__dirname, 'logs');

  [uploadsDir, logsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      } catch (err) {
        logger.warn(`Could not create directory ${dir}:`, err.message);
      }
    }
  });
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: config.nodeEnv === 'production' 
    ? config.frontendUrl 
    : '*',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', apiLimiter);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Import routes
const healthRoutes = require('./routes/health');
const transcribeRoutes = require('./routes/transcribe');
const summarizeRoutes = require('./routes/summarize');
const emailRoutes = require('./routes/email');

// Register routes
app.use('/api/health', healthRoutes);
app.use('/api/transcribe', transcribeRoutes);
app.use('/api/summarize', summarizeRoutes);
app.use('/api/send-email', emailRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Voice Agent API Server',
    status: 'running',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Request error', {
    error: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', { path: req.path, method: req.method });
  res.status(404).json({ error: 'Route not found' });
});

// Only start server if not in Vercel serverless environment
if (process.env.VERCEL !== '1') {
  // Graceful shutdown
  const server = app.listen(PORT, () => {
    logger.info(`Voice Agent Server started`, {
      port: PORT,
      nodeEnv: config.nodeEnv,
      frontendUrl: config.frontendUrl
    });
    
    logger.info('Available endpoints', {
      endpoints: [
        'GET  /api/health',
        'POST /api/transcribe',
        'POST /api/summarize',
        'POST /api/send-email'
      ]
    });
  });

  // Handle graceful shutdown
  const gracefulShutdown = (signal) => {
    logger.info(`${signal} received, starting graceful shutdown`);
    
    server.close(() => {
      logger.info('HTTP server closed');
      
      // Clean up resources
      // Close database connections, etc.
      
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', { reason, promise });
    process.exit(1);
  });
} else {
  // In Vercel serverless environment
  logger.info('Running in Vercel serverless environment');
}

module.exports = app;
