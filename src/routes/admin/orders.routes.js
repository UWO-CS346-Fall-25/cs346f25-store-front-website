const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { bind } = require('express-page-registry');
const { masterClient } = require('../../models/supabase.js');
const { authRequired, adminRequired } = require('../../middleware/accountRequired.js');
const cache = require('../../controllers/cache.js');
const productDB = require('../../models/productDatabase.js');

const csrfProtection = csrf({ cookie: false });

bind(router, {
  route: '/orders',
  view: 'admin/orders',
  meta: { title: 'Orders' },
  middleware: [authRequired, adminRequired, csrfProtection, require('../../middleware/csrfLocals.js')],
  getData: async function (req) {
    const supabase = masterClient();
    const flash = req.session?.flash;
    if (req.session) delete req.session.flash;

    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Number(req.query.pageSize) || 20;
    const status = (req.query.status || '').trim();
    const q = (req.query.q || '').trim();

    try {
      let query = supabase
        .from('orders_view')
        .select('id, number, user_id, status, placed_at, total_cents, currency', { count: 'exact' });

      if (status) query = query.eq('status', status);
      if (q) query = query.ilike('number', `%${q}%`);

      query = query.order('placed_at', { ascending: false });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data: rows, error, count } = await query.range(from, to);

      if (error) {
        console.error('Error fetching admin orders:', error);
        return { orders: [], flash: { error: 'Failed to load orders.' } };
      }

      // Efficiently resolve user emails for the orders using cache + batch lookup
      // 1) collect unique user ids
      const userIds = [...new Set((rows || []).map(r => r.user_id).filter(Boolean))];
      const userMap = {};

      if (userIds.length) {
        const missing = [];

        // Try cache first
        for (const id of userIds) {
          const cached = cache.get(`user:email:${id}`);
          if (cached !== null && typeof cached !== 'undefined') {
            // cached may be null if previously missing
            userMap[id] = cached ? { id, email: cached } : null;
          } else {
            missing.push(id);
          }
        }

        // Batch fetch missing ids from auth.users
        if (missing.length) {
          try {
            const { data: users, error: usersErr } = await supabase
              .from('auth.users')
              .select('id, email')
              .in('id', missing);

            if (!usersErr && Array.isArray(users)) {
              for (const u of users) {
                userMap[u.id] = { id: u.id, email: u.email };
                // cache email for 30 minutes
                try { cache.set(`user:email:${u.id}`, u.email, 1000 * 60 * 30); } catch (e) { /* ignore cache errors */ }
              }
            }

            // For any missing ids not returned, store null in cache to avoid repeat lookups
            const foundIds = new Set((users || []).map(u => u.id));
            for (const id of missing) {
              if (!foundIds.has(id)) {
                userMap[id] = null;
                try { cache.set(`user:email:${id}`, null, 1000 * 60 * 30); } catch (e) { }
              }
            }
          } catch (e) {
            console.error('Error batch fetching users for orders list:', e);
            // fallback: leave userMap entries undefined so we don't crash
          }
        }
      }

      const fmtCurrency = (cents, currency = 'USD') =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((cents || 0) / 100);

      const orders = (rows || []).map((r) => ({
        ...r,
        placed_at_display: r.placed_at ? new Date(r.placed_at).toLocaleString() : '',
        total_display: fmtCurrency(r.total_cents, r.currency || 'USD'),
        user_email: (r.user_id && userMap[r.user_id] && userMap[r.user_id].email) || null,
      }));

      const total = count || 0;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));

      return {
        orders,
        filters: { page, pageSize, total, totalPages, status, q },
        flash,
      };
    } catch (err) {
      console.error('Exception fetching admin orders:', err);
      return { orders: [], flash: { error: 'Failed to load orders.' } };
    }
  }
});

bind(router, {
  route: '/order/:id',
  view: 'admin/order-details',
  meta: { title: 'Order Details' },
  middleware: [authRequired, adminRequired, csrfProtection, require('../../middleware/csrfLocals.js')],
  getData: async function (req, res) {
    const supabase = masterClient();
    const flash = req.session?.flash;
    if (req.session) delete req.session.flash;

    const id = req.params.id;
    if (!id) {
      res.status(400);
      return { error: 'Order ID required' };
    }

    try {
      const { data: row, error } = await supabase
        .from('orders_view')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error loading order detail (admin):', error);
        res.status(500);
        return { error: 'Failed to load order' };
      }

      if (!row) {
        res.status(404);
        return { notFound: true, error: 'Order not found' };
      }

      // Format dates and currency
      const placed_at_display = row.placed_at
        ? new Date(row.placed_at).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
        : '';

      const shipping_eta_display = row.shipping_eta
        ? new Date(row.shipping_eta).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        : null;

      const currency = row.currency || 'USD';
      const fmtCurrency = (cents) => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format((cents || 0) / 100);

      // Prepare items and resolve product metadata (images)
      let items = (row.items || []).map((it) => ({
        ...it,
        unit_price_display: fmtCurrency(it.unit_price_cents),
        total_display: fmtCurrency(it.total_cents),
      }));

      const productIds = [...new Set(items.map(it => it.product_id).filter(Boolean))];
      let productMap = {};
      if (productIds.length) {
        const proms = await Promise.all(productIds.map(id => productDB.getByID(id)));
        const products = proms.filter(Boolean);
        await productDB.bindPrimaryImage(products);
        productMap = Object.fromEntries(products.map(p => [p.id, p]));
      }

      items = items.map((it) => {
        const p = it.product_id ? productMap[it.product_id] : null;
        return {
          ...it,
          product: p ? { id: p.id, name: p.name, slug: p.slug, url: p.slug ? `/shop/${p.slug}` : null, image: p.image || null } : null,
        };
      });

      // Resolve user email via cache first
      let user_email = null;
      try {
        const cached = cache.get(`user:email:${row.user_id}`);
        if (cached !== null && typeof cached !== 'undefined') {
          user_email = cached;
        } else if (row.user_id) {
          const { data: uRow, error: userErr } = await supabase.from('auth.users').select('id,email').eq('id', row.user_id).maybeSingle();
          if (!userErr && uRow) {
            user_email = uRow.email;
            cache.set(`user:email:${row.user_id}`, user_email, 1000 * 60 * 30);
          } else {
            cache.set(`user:email:${row.user_id}`, null, 1000 * 60 * 30);
          }
        }
      } catch (e) {
        console.error('Error resolving user email for admin order detail:', e);
      }

      const order = {
        id: row.id,
        number: row.number,
        status: row.status,
        status_display: row.status, // could map nicer labels if desired
        placed_at: row.placed_at,
        placed_at_display,
        subtotal_cents: row.subtotal_cents,
        shipping_cents: row.shipping_cents,
        tax_cents: row.tax_cents,
        total_cents: row.total_cents,
        currency,
        subtotal_display: fmtCurrency(row.subtotal_cents),
        shipping_display: fmtCurrency(row.shipping_cents),
        tax_display: fmtCurrency(row.tax_cents),
        total_display: fmtCurrency(row.total_cents),
        carrier: row.carrier,
        tracking_code: row.tracking_code,
        shipping_eta: row.shipping_eta,
        shipping_eta_display,
        shipping_address: row.shipping_address || null,
        billing_address: row.billing_address || null,
        items,
        user_email,
      };

      return { flash, order };
    } catch (err) {
      console.error('Exception loading admin order detail:', err);
      res.status(500);
      return { error: 'Failed to load order' };
    }
  }
});

module.exports = router;
