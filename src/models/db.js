/**
 * Database Connection
 *
 * This file sets up the PostgreSQL connection pool using the 'pg' library.
 * The pool manages multiple database connections efficiently.
 *
 * Usage:
 * const db = require('./models/db');
 * const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
 */

const { Pool } = require('pg');
const dbStats = require('../controllers/dbStats');
const debug = require('debug')('app:db');

// Create connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'your_database_name',
  user: process.env.DB_USER || 'your_database_user',
  password: process.env.DB_PASSWORD || 'your_database_password',
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
});

// Test connection
pool.on('connect', () => {});

pool.on('error', (err) => {
  debug.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Execute a SQL query
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters (for parameterized queries)
 * @returns {Promise<object>} Query result
 */
const query = (text, params) => {
  // record every call through this helper
  try {
    dbStats.increment(1);
  } catch (e) {
    /* never crash on stats */
  }
  return pool.query(text, params);
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<object>} Database client
 */
const getClient = async () => {
  const client = await pool.connect();
  // Wrap client's query so queries done via transaction clients are counted too
  const origQuery = client.query.bind(client);
  client.query = (...args) => {
    try {
      dbStats.increment(1);
    } catch (e) {
      /* ignore */
    }
    return origQuery(...args);
  };
  return client;
};

module.exports = {
  query,
  getClient,
  pool,
};
