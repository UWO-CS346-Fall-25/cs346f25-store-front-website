// logger.js
const nodeColorLog = require('node-color-log');

// Global in-memory store of all log messages, grouped by context
if (!global.__LOG_MESSAGES__) {
  /**
   * Map<string, Array<{
   *   id: string
   *   level: 'info' | 'warn' | 'error'
   *   context: string
   *   timestamp: string
   *   message: string
   *   details: any[]
   * }>>
   */
  global.__LOG_MESSAGES__ = new Map();
}
if (!global.__LOG_UNREAD_COUNT__) {
  global.__LOG_UNREAD_COUNT__ = 0;
}

function getStore() {
  return global.__LOG_MESSAGES__;
}
function getUnreadCount() {
  return global.__LOG_UNREAD_COUNT__;
}
function resetUnreadCount() {
  global.__LOG_UNREAD_COUNT__ = 0;
}

function ensureContext(context) {
  const store = getStore();
  if (!store.has(context)) {
    store.set(context, []);
  }
  return store.get(context);
}

function createLogger(context = 'App') {
  ensureContext(context);

  function write(level, message, ...details) {
    if (process.env.DEBUG_MODE !== 'true' && level === 'debug') {
      return; // skip debug logs if not in debug mode
    }
    const now = new Date();
    const isoTs = now.toISOString();
    const prefix = `[${isoTs}][${context}]`;

    if (level === 'error') {
      global.__LOG_UNREAD_COUNT__ += 1;
    }

    // Normalize main message to string
    const msgText =
      typeof message === 'string' ? message : JSON.stringify(message, null, 2);

    // Store in global map
    const entry = {
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      level,
      context,
      timestamp: isoTs,
      message: msgText,
      details: [...details],
    };

    const ctxLogs = ensureContext(context);
    ctxLogs.push(entry);
    // Choose color per log level
    const color =
      level === 'error'
        ? 'red'
        : level === 'system'
          ? 'cyan'
          : level === 'debug'
            ? 'white'
            : level === 'warn'
              ? 'yellow'
              : 'green'; // info/log

    // Build styled console output with node-color-log:
    // [time][context] normal
    // message in bold
    // details printed after (objects, etc.)
    let l = nodeColorLog.color(color);
    l = l.append(prefix + ' ');
    l = l.bold().append(msgText).reset();

    if (details.length > 0 && level === 'error') {
      for (var i = 0; i < details.length; i++) {
        details[i] = ' ' + details[i];
      }
      l.log(...details);
    } else {
      // still flush what we appended
      l.log('');
    }
  }

  return {
    // "log" == info level
    log: (message, ...details) => write('debug', message, ...details),
    info: (message, ...details) => write('info', message, ...details),
    warn: (message, ...details) => write('warn', message, ...details),
    error: (message, ...details) => write('error', message, ...details),
    debug: (message, ...details) => write('debug', message, ...details),
    system: (message, ...details) => write('system', message, ...details),
  };
}

// Helpers for your admin/EJS view

function getLogStore() {
  // returns the Map<context, entries[]>
  return getStore();
}

function getAllLogs() {
  // Flatten and sort all logs by time
  const all = [];
  for (const [, entries] of getStore()) {
    all.push(...entries);
  }
  return all.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

module.exports = createLogger;
module.exports.getLogStore = getLogStore;
module.exports.getAllLogs = getAllLogs;
module.exports.getUnreadCount = getUnreadCount;
module.exports.resetUnreadCount = resetUnreadCount;
