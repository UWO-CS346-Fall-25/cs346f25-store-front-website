const { authClient } = require('./supabase');

const NAMESPACE = 'userDB';
const TTL = 60_000 * 2; // 2 minutes
const PAGE_SIZE = 10;


const fmtCurrency = (cents, currency = 'USD', locale = 'en-US') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format((cents || 0) / 100);

const statusLabel = (s) => {
  if (!s) return 'Unknown';
  const map = {
    processing: 'Processing',
    packed: 'Packed',
    awaiting_shipment: 'Awaiting shipment',
    shipped: 'Shipped',
    in_transit: 'In transit',
    delivered: 'Delivered',
    canceled: 'Canceled',
    cancelled: 'Canceled',
    refunded: 'Refunded',
    on_hold: 'On hold',
  };
  return map[s.toLowerCase()] || s;
};


function unifyOrders(orders) {

  const items = (orders || []).map(o => ({
    ...o,
    placed_at_display: new Date(o.placed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
    total_display: fmtCurrency(o.total_cents, o.currency),
    status_display: statusLabel(o.status),
  }));
  return items;
}


async function getUser(req) {
  if (!req.user?.id) return { error: 'Failed to fetch user data', errorDetail: "No user ID in request" };
  const flash = req.session?.flash || null;
  if (req.session && req.session.flash) {
    delete req.session.flash;
  }

  return {
    error: false,
    id: req.user.id,
    supabase: authClient(req),
    flash: flash,
    user: { firstName: req.user.first_name, lastName: req.user.last_name, email: req.user.email },
  };
}



async function bindAddresses(user) {
  if (user.error) return user;

  const { data: addresses, error: addrErr } = await user.supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default_shipping', { ascending: false })
    .order('is_default_billing', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(5);

  if (addrErr) {
    console.error('Error fetching addresses:', addrErr);
    return { ...user, error: 'Failed to fetch addresses', errorDetail: addrErr };
  }
  return { ...user, addresses };
}

async function bindOrders(user, { page = 1, status = '', q = '' }) {
  if (user.error) return user;

  let query = user.supabase
    .from('orders_view')
    .select('id, number, status, placed_at, total_cents, currency, carrier, tracking_code, shipping_eta', { count: 'exact' })
    .eq('user_id', user.id);

  if (status) query = query.eq('status', status);
  if (q) query = query.ilike('number', `%${q}%`);

  query = query.order('placed_at', { ascending: false });

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: rows, error, count } = await query.range(from, to);
  if (error) {
    console.error('Error fetching orders:', error);
    return { ...user, error: 'Failed to fetch orders', errorDetail: error };
  }

  const items = unifyOrders(rows);

  const total = count || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Status tab counts (optional: quick chips at top)
  // Cheap approach: 3 small count queries; fast on typical user-sized datasets.
  const statusesToCount = ['', 'processing', 'shipped', 'delivered'];
  const tabCounts = {};
  await Promise.all(statusesToCount.map(async (s) => {
    let qc = user.supabase.from('orders_view').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if (s) qc = qc.eq('status', s);
    if (q) qc = qc.ilike('number', `%${q}%`);
    const { count: c } = await qc;
    tabCounts[s || 'all'] = c || 0;
  }));

  return {
    ...user,
    filters: { page, status, q, pageSize: PAGE_SIZE, total, totalPages, tabCounts },
    orders: items,
  };
}

async function bindOrderSummary(user) {
  if (user.error) return user;

  const { data: recentOrdersRaw, error: ordersErr } = await user.supabase
    .from('orders_view')
    .select('id, number, status, placed_at, total_cents, currency, carrier, tracking_code, shipping_eta')
    .eq('user_id', user.id)
    .order('placed_at', { ascending: false })
    .limit(5);

  if (ordersErr) {
    console.error('Error fetching recent orders:', ordersErr);
    return { ...user, error: 'Failed to fetch recent orders', errorDetail: ordersErr };
  }
  const recentOrders = unifyOrders(recentOrdersRaw);

  const { data: counts, error: countsErr } = await user.supabase
    .rpc('order_summary_counts', { p_user_id: user.id });
  if (countsErr) {
    console.error('Error fetching order counts:', countsErr);
    return { ...user, error: 'Failed to fetch order counts', errorDetail: countsErr };
  }



  const { open = 0, shipped = 0, delivered = 0 } = counts[0] || {};
  const orders_total = open + shipped + delivered;
  const orders_open = open + shipped;

  return {
    ...user,
    stats: {
      orders_total,
      orders_open,
      returns: 0,
    },
    recentOrders,
  }
}


module.exports = {
  getUser,
  bindAddresses,
  bindOrders,
  bindOrderSummary,
};

