
require('dotenv').config();

const cl = require('node-color-log');
function logMessageColor(level, msg, subMessage, timestamp) {
  cl.color(level.color).append(`${msg}: `).bold().log(subMessage);
}
const levels = {
  SYSTEM: { name: 'SYSTEM', color: 'cyan' },
  ERROR: { name: 'ERROR', color: 'red' },
  WARN: { name: 'WARN', color: 'yellow' },
  INFO: { name: 'INFO', color: 'green' },
  LOG: { name: 'LOG', color: 'white' },
}


let isMockDB;
async function validateDatabase(timeoutMs = 3000) {
  if (isMockDB !== undefined) return isMockDB;
  const db = require('../models/db.js');
  const testPromise = (async () => {
    const client = await db.getClient();
    try {
      await client.query('SELECT 1');    // ensures connection actually works
      isMockDB = false;
    } finally {
      client.release();
    }
  })();

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('DB_TEST_TIMEOUT')), timeoutMs)
  );

  try {
    await Promise.race([testPromise, timeout]);
  } catch (err) {
    isMockDB = true;
  }

  return isMockDB;
}


const debug = {
  isMockDB: isMockDB,
  isDebugMode() { return process.env.DEBUG_MODE !== 'false'; },
  validateDatabase,
  logLevel(logLevel, msg, subMessage) {
    if (this.isDebugMode()) {
      logMessageColor(logLevel, msg, subMessage, new Date());
    }
  },
  info(msg, subMessage) { this.logLevel(levels.INFO, msg, subMessage); },
  warn(msg, subMessage) { this.logLevel(levels.WARN, msg, subMessage); },
  error(msg, subMessage) { this.logLevel(levels.ERROR, msg, subMessage); },
  system(msg, subMessage) { this.logLevel(levels.SYSTEM, msg, subMessage); },
  log(msg, subMessage) { this.logLevel(levels.LOG, msg, subMessage); },
};



module.exports = debug;


