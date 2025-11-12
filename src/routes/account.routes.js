

const express = require('express');
const router = express.Router();
const { bind } = require('express-page-registry');
const { authRequired } = require('../middleware/accountRequired.js');
const { authClient } = require('../models/supabase');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: false });


const fmtCurrency = (cents, currency = 'USD', locale = 'en-US') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format((cents || 0) / 100);

const statusLabel = (s) => {
  if (!s) return 'Unknown';
  const map = {
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    canceled: 'Canceled',
    cancelled: 'Canceled', // safety
    refunded: 'Refunded',
    on_hold: 'On hold',
  };
  return map[s.toLowerCase()] || s;
};

const isOpenStatus = (s) => ['processing', 'shipped', 'on_hold'].includes(String(s || '').toLowerCase());


bind(router, {
  route: '/account',
  view: 'account/overview',
  meta: { title: 'Account Overview' },
  middleware: [authRequired, csrfProtection, require('../middleware/csrfLocals')],
  getData: async function (req) {
    const supabase = authClient(req);
    const userId = req.user.id;
    const flash = req.session?.flash;


    const { data: addresses, error: addrErr } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default_shipping', { ascending: false })
      .order('is_default_billing', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(5);

    const { data: recentOrdersRaw, error: ordersErr } = await supabase
      .from('orders_view')
      .select('id, number, status, placed_at, total_cents, currency, carrier, tracking_code, shipping_eta')
      .eq('user_id', userId)
      .order('placed_at', { ascending: false })
      .limit(5);

    const recentOrders = (recentOrdersRaw || []).map((o) => ({
      ...o,
      placed_at_display: DateTime.fromISO(o.placed_at).toLocaleString({ month: 'short', day: 'numeric', year: 'numeric' }),
      total_display: fmtCurrency(o.total_cents, o.currency),
      status_display: statusLabel(o.status),
    }));


    const { data: counts, error: countsErr } = await supabase
      .rpc('order_summary_counts', { p_user_id: userId });

    const { open = 0, shipped = 0, delivered = 0 } = counts || {};
    const orders_total = open + shipped + delivered;
    const orders_open = open + shipped;

    return {
      user: req.user,

      stats: {
        orders_total,
        orders_open,
        returns: 0, // update if/when you model returns
      },
      addresses: addresses,
      recentOrders,
      flash,
    };
  }
});


// GET /account/orders
router.get('/account/orders', authRequired, csrfProtection, async (req, res, next) => {
  try {
    const supabase = authClient(req);
    const userId = req.user.id;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: orders, count, error } = await supabase
      .from('orders')
      .select('id, number, status, total_cents, placed_at, shipping_eta, carrier, tracking_code', { count: 'exact' })
      .eq('user_id', userId)
      .order('placed_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.render('account/orders', {
      csrfToken: req.csrfToken(),
      user: req.user,
      orders: orders || [],
      page,
      pageCount: Math.max(1, Math.ceil((count || 0) / pageSize))
    });
  } catch (e) { next(e); }
});

// GET /account/orders/:id
router.get('/account/orders/:id', authRequired, csrfProtection, async (req, res, next) => {
  try {
    const supabase = authClient(req);
    const userId = req.user.id;
    const orderId = req.params.id;

    const { data: order, error } = await supabase
      .from('orders_view') // often useful to join items/address into a view
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!order) {
      req.flash?.('error', 'Order not found.');
      return res.redirect('/account/orders');
    }

    res.render('account/order-detail', {
      csrfToken: req.csrfToken(),
      user: req.user,
      order
    });
  } catch (e) { next(e); }
});

// GET /account/security
router.get('/account/security', authRequired, csrfProtection, (req, res) => {
  res.render('account/security', {
    csrfToken: req.csrfToken(),
    user: req.user
  });
});

// POST /account/security/password
router.post('/account/security/password', authRequired, csrfProtection, async (req, res, next) => {
  try {
    const supabase = authClient(req);
    const { new_password, confirm_password } = req.body;
    if (!new_password || new_password !== confirm_password) {
      req.flash?.('error', 'Passwords do not match.');
      return res.redirect('/account/security');
    }

    const { error } = await supabase.auth.updateUser({ password: new_password });
    if (error) {
      req.flash?.('error', 'Could not change password.');
      return res.redirect('/account/security');
    }

    req.flash?.('success', 'Password updated.');
    res.redirect('/account/security');
  } catch (e) { next(e); }
});




module.exports = router;