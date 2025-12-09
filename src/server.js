/**
 * Server Entry Point
 *
 * This file is responsible for:
 * - Loading environment variables
 * - Starting the Express application
 * - Handling server startup errors
 */

require('dotenv').config();
const app = require('./app');
const debug = require('./controllers/debug.js')('server');

// Server configuration
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, async () => {
  debug.system('Environment Setup', `${process.env.NODE_ENV || 'development'}`);
  debug.system(
    `Server Listening : http://localhost:${PORT}`,
    `http://localhost:${PORT}`
  );
});

// Handle server errors
process.on('unhandledRejection', (err) => {
  debug.error('Unhandled Promise Rejection', err);
  // In production, you might want to exit the process
  // process.exit(1);
});

process.on('uncaughtException', (err) => {
  debug.error('Uncaught Exception', err);
  // In production, you might want to exit the process
  // process.exit(1);
});
