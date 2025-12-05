const supabase = require('./supabase.js');
const dbStats = require('../controllers/dbStats.js');
const debug = require('debug')('app:admin-badges');

async function orders() {
  try {
    const db = supabase.masterClient();
    const { error, count } = await db
      .from('orders_view')
      .select('id', { count: 'exact', head: true })
      .in('status', ['processing', 'packed', 'awaiting_shipment']);
    dbStats.increment();
    if (!error && typeof count === 'number') return count;
  } catch (e) {
    debug.error('Error counting pending orders for badges:', e);
  }
  return 0;
}

async function logs() {
  return require('../controllers/debug.js').getUnreadCount();
}

async function todo() {
  try {
    const todoPath = require('path').join(
      __dirname,
      '..',
      '..',
      'docs',
      'TODO.md'
    );
    const md = await fs.readFile(todoPath, { encoding: 'utf8' });
    if (md) {
      const matches = md.match(/- \[ \]/g);
      return matches ? matches.length : 0;
    }
  } catch (e) {
    // ignore if file not present
  }
  return 0;
}
async function products() {
  try {
    const db = supabase.masterClient();
    const { count, error } = await db
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft');
    dbStats.increment();
    if (error) {
      debug.error('Error counting draft products for badges:', error);
      return 0;
    }
    return count;
  } catch (e) {
    debug.error('Error counting draft products for dashboard:', e);
  }
  return 0;
}
async function messages() {
  try {
    const db = supabase.masterClient();
    const { count, error } = await db
      .from('unread_messages')
      .select('*', { count: 'exact', head: true })
      .eq('unread', true);
    dbStats.increment();
    if (error) {
      debug.error('Error counting unread messages for badges:', error);
      return 0;
    }
    return count;
  } catch (e) {
    debug.error('Error counting unread messages for dashboard:', e);
  }
  return 0;
}

module.exports = {
  orders,
  logs,
  todo,
  products,
  messages,
};
