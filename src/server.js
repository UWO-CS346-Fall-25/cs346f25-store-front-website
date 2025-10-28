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

// Server configuration
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, async () => {
  const debug = require('./controllers/debug.js');

  await debug.validateDatabase();
  debug.system('Database: ', debug.isMockDB ? 'mock' : 'real');
  debug.system('Environment: ', `${process.env.NODE_ENV || 'development'}`);
  debug.info('Server up on ', `http://localhost:${PORT}`);
});

// Handle server errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // In production, you might want to exit the process
  // process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // In production, you might want to exit the process
  // process.exit(1);
});
