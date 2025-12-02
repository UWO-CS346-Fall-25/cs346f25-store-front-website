const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { bind } = require('express-page-registry');
const { masterClient } = require('../../models/supabase.js');
const { authRequired, adminRequired } = require('../../middleware/accountRequired.js');
const cache = require('../../controllers/cache.js');
const productDB = require('../../models/productDatabase.js');
const dbStats = require('../../controllers/dbStats.js');

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
    // Determine status filter: if the `status` query param is absent, default to the "pending" group.
    // If the param is present but an empty string (user selected "All statuses"), treat as no filter.
    const status = (req.query.status === undefined) ? 'pending' : String(req.query.status || '').trim();
    const q = (req.query.q || '').trim();
    // Ordering: allow 'asc' or 'desc'; default to 'asc' so earliest placed orders appear first.
    const orderParam = (req.query.order === undefined) ? 'asc' : String(req.query.order || '').trim().toLowerCase();
    const order = orderParam === 'desc' ? 'desc' : 'asc';

    try {
      let query = supabase
        .from('orders_view')
        .select('id, number, user_id, status, placed_at, total_cents, currency', { count: 'exact' });
      dbStats.increment();

      // Support a "pending" virtual filter that includes several statuses
      if (status === 'pending') {
        query = query.in('status', ['processing', 'packed', 'awaiting_shipment']);
      } else if (status) {
        query = query.eq('status', status);
      }
      if (q) query = query.ilike('number', `%${q}%`);

      // Order by placed_at: ascending when 'asc', descending when 'desc'
      query = query.order('placed_at', { ascending: order === 'asc' });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data: rows, error, count } = await query.range(from, to);

      if (error) {
        console.error('Error fetching admin orders:', error);
        return { orders: [], flash: { error: 'Failed to load orders.' } };
      }
      const TTL = 60_000; // 1 minute cache for user emails
      await Promise.all(rows.map(async (c) => {
        c.email = await cache.wrap("user:email:" + c.user_id, TTL, async () => {
          try {
            const { data: listData, error: userErr } = await supabase.auth.admin.getUserById(c.user_id);
            dbStats.increment();
            if (userErr) {
              console.error('Error fetching user for order listing:', userErr);
              return null;
            }
            return listData.user ? listData.user.email : null;
          } catch (e) {
            console.error('Error fetching user email for order listing:', e);
          }
        });
      }));


      const fmtCurrency = (cents, currency = 'USD') =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((cents || 0) / 100);

      const orders = (rows || []).map((r) => ({
        ...r,
        placed_at_display: r.placed_at ? new Date(r.placed_at).toLocaleDateString() : '',
        total_display: fmtCurrency(r.total_cents, r.currency || 'USD'),
      }));

      const total = count || 0;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));

      return {
        orders,
        filters: { page, pageSize, total, totalPages, status, q, order },
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
      dbStats.increment();

      if (error) {
        console.error('Error loading order detail (admin):', error);
        res.status(500);
        return { error: 'Failed to load order' };
      }

      const TTL = 60_000; // 1 minute cache for user emails


      if (!row) {
        res.status(404);
        return { notFound: true, error: 'Order not found' };
      }
      row.email = await cache.wrap("user:email:" + row.user_id, TTL, async () => {
        try {
          const { data: listData, error: userErr } = await supabase.auth.admin.getUserById(row.user_id);
          dbStats.increment();
          if (userErr) {
            console.error('Error fetching user for order listing:', userErr);
            return null;
          }
          return listData.user ? listData.user.email : null;
        } catch (e) {
          console.error('Error fetching user email for order listing:', e);
        }
      });

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


      const order = {
        ...row,
        currency,
        subtotal_display: fmtCurrency(row.subtotal_cents),
        shipping_display: fmtCurrency(row.shipping_cents),
        tax_display: fmtCurrency(row.tax_cents),
        total_display: fmtCurrency(row.total_cents),
        shipping_eta_display,
        items,
        placed_at_display,
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
