/**
 * A simple in-memory cache with TTL (time-to-live) and deduplication of concurrent loads.
 * Provides methods to get, set, delete, and clear cache entries, as well as wrap a loader function with caching.
 */

const store = new Map();
const inflight = new Map();

function now() { return Date.now(); }

// simple in-memory cache with TTL and deduplication of concurrent loads
function get(key) {
  const hit = store.get(key);
  if (!hit) return null;
  if (hit.exp !== 0 && hit.exp < now()) { store.delete(key); return null; }
  return hit.value;
}

// set with TTL in ms (0 = no expiry)
function set(key, value, ttlMs = 60_000) {
  const exp = ttlMs === 0 ? 0 : now() + ttlMs;
  store.set(key, { value, exp });
  return value;
}

// delete a key
function del(key) { store.delete(key); }

// clear all keys starting with ns + ":"
function clearNamespace(ns) {
  for (const k of store.keys()) if (k.startsWith(ns)) store.delete(k);
}


/**
 * Wraps a loader function with caching and deduplication of concurrent loads.
 * If the value is already cached, it is returned. Otherwise, the loader function is executed,
 * and its result is cached and returned.
 * 
 * @param {string} key - The key of the cache entry.
 * @param {number} ttlMs - The TTL in milliseconds for the cached value.
 * @param {() => Promise<*>} loader - The loader function to execute if the value is not cached.
 * @returns {Promise<*>} A promise that resolves to the cached or loaded value.
 */
async function wrap(key, ttlMs, loader) {
  const cached = get(key);
  if (cached != null) return cached;

  if (inflight.has(key)) return inflight.get(key);
  const p = Promise.resolve().then(loader).then(val => {
    set(key, val, ttlMs);
    inflight.delete(key);
    return val;
  }).catch(err => { inflight.delete(key); throw err; });

  inflight.set(key, p);
  return p;
}

module.exports = { get, set, del, wrap, clearNS: clearNamespace };
