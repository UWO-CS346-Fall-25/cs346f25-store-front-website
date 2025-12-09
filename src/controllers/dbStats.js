/**
 * Simple in-memory DB call statistics collector.
 * Tracks counts in minute buckets and exposes simple APIs for retrieval.
 */
const MS_PER_MIN = 60 * 1000;

// Map from minuteBucket (number) -> count
const buckets = new Map();

function _currentBucket() {
  return Math.floor(Date.now() / MS_PER_MIN);
}

function increment(count = 1) {
  try {
    const b = _currentBucket();
    buckets.set(b, (buckets.get(b) || 0) + count);
  } catch (e) { /* ignore */ }
}

function getSeries(minutes = 60) {
  const now = _currentBucket();
  const series = [];
  for (let i = now - (minutes - 1); i <= now; i++) {
    const ts = new Date(i * MS_PER_MIN).toISOString();
    series.push({ ts, count: buckets.get(i) || 0 });
  }
  return series;
}

function getTotal() {
  let total = 0;
  for (const v of buckets.values()) total += v;
  return total;
}

function reset() {
  buckets.clear();
}

module.exports = {
  increment,
  getSeries,
  getTotal,
  reset,
};
