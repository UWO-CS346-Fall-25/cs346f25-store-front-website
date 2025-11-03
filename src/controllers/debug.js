// debug.js
require('dotenv').config();
const cl = require('node-color-log');

function logMessageColor(level, msg, subMessage) {
  cl.color(level.color).append(`${msg}: `).bold().log(subMessage ?? "");
}

const levels = {
  SYSTEM: { name: 'SYSTEM', color: 'cyan' },
  ERROR: { name: 'ERROR', color: 'red' },
  WARN: { name: 'WARN', color: 'yellow' },
  INFO: { name: 'INFO', color: 'green' },
  LOG: { name: 'LOG', color: 'white' },
};

// ---- DB probe (cached) ----
let mockDb;

async function probeDatabase(timeoutMs = 3000) {
  if (process.env.FORCE_MOCK_DB === 'true') return true; // manual override

  if (mockDb !== undefined) return mockDb;

  const db = require('../models/db.js');

  const testPromise = (async () => {
    const client = await db.getClient();   // rejects on bad host/creds
    try {
      await client.query('SELECT 1');      // sanity query
      mockDb = false;
    } finally {
      client.release();
    }
  })();

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('DB_TEST_TIMEOUT')), timeoutMs)
  );

  try {
    await Promise.race([testPromise, timeout]);
  } catch {
    mockDb = true;
  }
  return mockDb;
}

// ---- Public singleton API ----
let readyPromise; // run once, shared across all importers

const debug = {
  // Call once (e.g., in your app entry). Safe to await multiple times.
  ready() {
    if (!readyPromise) {
      readyPromise = (async () => {
        mockDb = await probeDatabase();
        return true;
      })();
    }
    return readyPromise;
  },

  isMockDB() { return !!mockDb; },

  isDebugMode() { return process.env.DEBUG_MODE !== 'false'; },

  logLevel(level, msg, subMessage) {
    if (this.isDebugMode()) logMessageColor(level, msg, subMessage);
  },

  info(msg, sub) { this.logLevel(levels.INFO, msg, sub); },
  warn(msg, sub) { this.logLevel(levels.WARN, msg, sub); },
  error(msg, sub) { this.logLevel(levels.ERROR, msg, sub); },
  system(msg, sub) { this.logLevel(levels.SYSTEM, msg, sub); },
  log(msg, sub) { this.logLevel(levels.LOG, msg, sub); },
};

module.exports = debug;
