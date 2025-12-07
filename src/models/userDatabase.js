const { authClient } = require('./supabase');
const cache = require('../controllers/cache.js');
const productDB = require('./productDatabase.js');

const NAMESPACE = 'userDB';
const TTL = 60_000 * 30; // 30 minutes
const PAGE_SIZE = 10;
const debug = require('../controllers/debug.js')('User Database');

const fmtCurrency = (cents, currency = 'USD', locale = 'en-US') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
    (cents || 0) / 100
  );

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
  const items = (orders || []).map((o) => ({
    ...o,
    placed_at_display: new Date(o.placed_at).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    total_display: fmtCurrency(o.total_cents, o.currency),
    status_display: statusLabel(o.status),
  }));
  return items;
}

async function getUser(req) {
  if (!req.user?.id)
    return {
      error: 'Failed to fetch user data',
      errorDetail: 'No user ID in request',
    };
  const flash = req.session?.flash || null;
  if (req.session && req.session.flash) {
    delete req.session.flash;
  }

  return {
    error: false,
    id: req.user.id,
    supabase: authClient(req),
    flash: flash,
    user: {
      ...req.user.user_metadata,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
    },
  };
}
const dbStats = require('../controllers/dbStats.js');

async function bindOrders(user, { page = 1, status = '', q = '' }) {
  if (user.error) return user;
  const key = `${NAMESPACE}:${user.id}:orders:${page}:${status}:${q}`;

  return await cache.wrap(key, TTL, async () => {
    let query = user.supabase
      .from('orders_view')
      .select(
        'id, number, status, placed_at, total_cents, currency, carrier, tracking_code, shipping_eta',
        { count: 'exact' }
      )
      .eq('user_id', user.id);
    dbStats.increment();
    if (status) query = query.eq('status', status);
    if (q) query = query.ilike('number', `%${q}%`);

    query = query.order('placed_at', { ascending: false });

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data: rows, error, count } = await query.range(from, to);
    if (error) {
      debug.error('Error fetching orders:', error);
      return { ...user, error: 'Failed to fetch orders', errorDetail: error };
    }

    const items = unifyOrders(rows);

    const total = count || 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // Status tab counts (optional: quick chips at top)
    // Cheap approach: 3 small count queries; fast on typical user-sized datasets.
    const statusesToCount = ['', 'processing', 'shipped', 'delivered'];
    const tabCounts = {};
    await Promise.all(
      statusesToCount.map(async (s) => {
        let qc = user.supabase
          .from('orders_view')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        dbStats.increment();
        if (s) qc = qc.eq('status', s);
        if (q) qc = qc.ilike('number', `%${q}%`);
        const { count: c } = await qc;
        tabCounts[s || 'all'] = c || 0;
      })
    );

    return {
      ...user,
      filters: {
        page,
        status,
        q,
        pageSize: PAGE_SIZE,
        total,
        totalPages,
        tabCounts,
      },
      orders: items,
    };
  });
}

async function bindOrderSummary(user) {
  if (user.error) return user;
  const key = `${NAMESPACE}:${user.id}:orderSummary`;

  return await cache.wrap(key, TTL, async () => {
    const { data: recentOrdersRaw, error: ordersErr } = await user.supabase
      .from('orders_view')
      .select(
        'id, number, status, placed_at, total_cents, currency, carrier, tracking_code, shipping_eta'
      )
      .eq('user_id', user.id)
      .order('placed_at', { ascending: false })
      .limit(5);
    dbStats.increment();
    if (ordersErr) {
      debug.error('Error fetching recent orders:', ordersErr);
      return {
        ...user,
        error: 'Failed to fetch recent orders',
        errorDetail: ordersErr,
      };
    }
    const recentOrders = unifyOrders(recentOrdersRaw);

    const { data: counts, error: countsErr } = await user.supabase.rpc(
      'order_summary_counts',
      { p_user_id: user.id }
    );
    if (countsErr) {
      debug.error('Error fetching order counts:', countsErr);
      return {
        ...user,
        error: 'Failed to fetch order counts',
        errorDetail: countsErr,
      };
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
    };
  });
}

async function bindOrderDetail(user, orderId) {
  if (user.error) return user;
  const key = `${NAMESPACE}:${user.id}:orderDetail:${orderId}`;

  return await cache.wrap(key, TTL, async () => {
    const { supabase, id: userId } = user;

    if (!orderId) {
      return {
        ...user,
        error: 'Order not specified',
        errorDetail: 'Missing order id parameter',
      };
    }

    // 1) Get order row from orders_view (includes shipping/billing + items json)
    const { data: row, error } = await supabase
      .from('orders_view')
      .select('*')
      .eq('user_id', userId)
      .eq('id', orderId)
      .maybeSingle(); // returns null if not found
    dbStats.increment();
    if (error) {
      debug.error('Error fetching order detail:', error);
      return { ...user, error: 'Failed to fetch order', errorDetail: error };
    }

    if (!row) {
      return {
        ...user,
        error: 'Order not found',
        errorDetail: 'not_found',
        notFound: true,
      };
    }

    const placed_at_display = row.placed_at
      ? new Date(row.placed_at).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
      : '';

    const shipping_eta_display = row.shipping_eta
      ? new Date(row.shipping_eta).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
      : null;

    const currency = row.currency || 'USD';

    let items = (row.items || []).map((it) => ({
      ...it,
      unit_price_display: fmtCurrency(it.unit_price_cents, currency),
      total_display: fmtCurrency(it.total_cents, currency),
    }));

    const productIds = [
      ...new Set(items.map((it) => it.product_id).filter((id) => id != null)),
    ];

    let productMap = {};
    if (productIds.length) {
      const productsRaw = await Promise.all(
        productIds.map((id) => productDB.getByID(id))
      );
      const products = productsRaw.filter(Boolean);

      await productDB.bindPrimaryImage(products);

      productMap = Object.fromEntries(products.map((p) => [p.id, p]));
    }

    items = items.map((it) => {
      const p = it.product_id ? productMap[it.product_id] : null;

      const productUrl = p?.slug ? `/shop/${p.slug}` : null;

      return {
        ...it,
        product: p
          ? {
            id: p.id,
            name: p.name,
            slug: p.slug,
            url: productUrl,
            image: p.image || null,
          }
          : null,
      };
    });

    const order = {
      id: row.id,
      number: row.number,
      status: row.status,
      status_display: statusLabel(row.status),
      placed_at: row.placed_at,
      placed_at_display,
      subtotal_cents: row.subtotal_cents,
      shipping_cents: row.shipping_cents,
      tax_cents: row.tax_cents,
      total_cents: row.total_cents,
      currency,
      subtotal_display: fmtCurrency(row.subtotal_cents, currency),
      shipping_display: fmtCurrency(row.shipping_cents, currency),
      tax_display: fmtCurrency(row.tax_cents, currency),
      total_display: fmtCurrency(row.total_cents, currency),
      carrier: row.carrier,
      tracking_code: row.tracking_code,
      shipping_eta: row.shipping_eta,
      shipping_eta_display,
      shipping_address: row.shipping_address || null,
      billing_address: row.billing_address || null,
      items,
    };

    return {
      ...user,
      order,
    };
  });
}

module.exports = {
  getUser,
  bindOrders,
  bindOrderSummary,
  bindOrderDetail,
};
