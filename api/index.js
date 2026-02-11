// Vercel serverless function entry point
// This wraps the Express app for Vercel's serverless environment

const app = require('../server');

// Export the Express app for Vercel
module.exports = app;
