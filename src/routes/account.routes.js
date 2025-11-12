

const express = require('express');
const router = express.Router();
const { authRequired } = require('../../middleware/accountRequired.js');
const { authClient } = require('../../models/supabase');

// GET /account (overview)
router.get('/account', authRequired, csrfProtection, async (req, res, next) => {
  try {
    const supabase = authClient(req);
    const userId = req.user.id;

    // summary stats for tiles
    const [{ data: latestOrders }, { data: counts }] = await Promise.all([
      supabase.from('orders')
        .select('id, number, status, total_cents, placed_at')
        .eq('user_id', userId)
        .order('placed_at', { ascending: false })
        .limit(5),
      supabase.rpc('order_summary_counts', { p_user_id: userId })
    ]);

    res.render('account/overview', {
      csrfToken: req.csrfToken(),
      user: req.user,
      latestOrders: latestOrders || [],
      counts: counts || { open: 0, shipped: 0, delivered: 0 }
    });
  } catch (e) { next(e); }
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