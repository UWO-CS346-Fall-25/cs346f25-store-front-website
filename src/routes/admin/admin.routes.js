const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { bind } = require('express-page-registry');
const db = require('../../models/productDatabase.js');
const { masterClient } = require('../../models/supabase.js');
const { authRequired, adminRequired } = require('../../middleware/accountRequired.js');

const csrfProtection = csrf({ cookie: false });

const logs = require('../../controllers/debug.js');
const utilities = require('../../models/admin-utilities.js');
const cache = require('../../controllers/cache.js');
const productDB = require('../../models/productDatabase.js');

bind(router, {
  route: '/',
  view: 'admin/dashboard',
  middleware: [authRequired, adminRequired, csrfProtection, require('../../middleware/csrfLocals.js')],
  meta: { title: 'Admin Dashboard' },
  getData: async function (req) {
    const flash = req.session?.flash;
    if (req.session) {
      delete req.session.flash;
    }
    return {
      flash,
      utilities: require('../../models/admin-utilities.js'),
    };
  }
});

bind(router, {
  route: '/users',
  view: 'admin/users',
  meta: { title: 'Users' },
  middleware: [authRequired, adminRequired, csrfProtection, require('../../middleware/csrfLocals.js')],
  getData: async function (req) {
    const flash = req.session?.flash;
    if (req.session) {
      delete req.session.flash;
    }
    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Number(req.query.perPage) || 10;
    const q = (req.query.q || '').trim();

    try {
      const supabase = masterClient();

      // If no search query, use the simple paged admin API
      if (!q) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

        if (error) {
          console.error('Error listing users:', error);
          return { users: [], flash: { error: 'Unable to load users' }, paging: { page, perPage, totalPages: 1 }, q };
        }

        const users = (data && data.users) || [];
        const total = (data && data.total) || null;
        const totalPages = total ? Math.max(1, Math.ceil(total / perPage)) : page;
        return {
          users,
          flash,
          paging: { page, perPage, totalPages },
          q,
        };
      }

      // If a search query is provided, fetch all users (page through the admin API),
      // filter on the server, then paginate the filtered results.
      const fetchPerPage = 100; // batch size for fetching users while searching
      let fetchPage = 1;
      let allUsers = [];
      let shouldContinue = true;

      while (shouldContinue) {
        const { data, error } = await supabase.auth.admin.listUsers({ page: fetchPage, perPage: fetchPerPage });
        if (error) {
          console.error('Error listing users while searching:', error);
          break;
        }

        const batch = (data && data.users) || [];
        allUsers = allUsers.concat(batch);

        // If returned fewer than requested, we reached the end
        if (batch.length < fetchPerPage) {
          shouldContinue = false;
        } else if (data && typeof data.total === 'number') {
          const totalPagesRemote = Math.max(1, Math.ceil(data.total / fetchPerPage));
          if (fetchPage >= totalPagesRemote) shouldContinue = false;
        } else {
          fetchPage++;
        }
      }

      const qlc = q.toLowerCase();
      const filtered = allUsers.filter(u => {
        const email = (u.email || '').toLowerCase();
        const display = (u.display_name || '').toLowerCase();
        const meta = u.user_metadata ? JSON.stringify(u.user_metadata).toLowerCase() : '';
        return email.includes(qlc) || display.includes(qlc) || meta.includes(qlc);
      });

      const totalMatches = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalMatches / perPage));

      // slice results for the requested page
      const start = (page - 1) * perPage;
      const usersPage = filtered.slice(start, start + perPage);

      return {
        users: usersPage,
        flash,
        paging: { page, perPage, totalPages },
        q,
      };
    } catch (err) {
      console.error('Exception listing users:', err);
      return { users: [], flash: { error: 'Unable to load users' }, paging: { page, totalPages: 1 }, q };
    }
  }
});
bind(router, {
  route: '/logs',
  view: 'admin/logs',
  middleware: [authRequired, adminRequired, csrfProtection, require('../../middleware/csrfLocals.js')],
  meta: { title: 'Admin Logs' },
  getData: async function (req) {
    const flash = req.session?.flash;
    if (req.session) {
      delete req.session.flash;
    }
    // Normalize logs so `details` is always an array of readable entries.
    const rawLogs = logs.getAllLogs();
    const normalized = rawLogs.map(entry => {
      const e = Object.assign({}, entry);
      let d = e.details;

      // If details already an array, stringify non-strings inside it
      if (Array.isArray(d)) {
        d = d.map(item => (typeof item === 'string' ? item : JSON.stringify(item, null, 2)));
      } else if (typeof d === 'string') {
        // Try to parse JSON (could be serialized array/object)
        try {
          const parsed = JSON.parse(d);
          if (Array.isArray(parsed)) {
            d = parsed.map(item => (typeof item === 'string' ? item : JSON.stringify(item, null, 2)));
          } else if (parsed == null) {
            d = [];
          } else {
            d = [typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)];
          }
        } catch (err) {
          // Not JSON — split on escaped or real newlines if present, otherwise wrap
          if (d.indexOf('\\n') !== -1) {
            d = d.split(/\\n+/).map(s => s);
          } else if (d.indexOf('\n') !== -1) {
            d = d.split(/\n+/).map(s => s);
          } else {
            d = [d];
          }
        }
      } else if (d == null) {
        d = [];
      } else {
        // Anything else (object, number, etc.) -> stringify and wrap
        d = [typeof d === 'string' ? d : JSON.stringify(d, null, 2)];
      }

      e.details = d;
      return e;
    });

    return {
      flash,
      logs: normalized,
    };
  }
});


bind(router, {
  route: '/products',
  view: 'admin/products',
  meta: { title: 'Products' },
  middleware: [authRequired, adminRequired, csrfProtection, require('../../middleware/csrfLocals.js')],
  getData: async function (req) {
    const products = await db.bindCategories(await db.bindPrimaryImage(await db.getAll()));

    const flash = req.session?.flash;
    if (req.session) {
      delete req.session.flash;
    }
    return {
      products,
      flash,
    };
  }
});
bind(router, {
  route: '/products/archived',
  view: 'admin/products-archived',
  meta: { title: 'Archived Products' },
  middleware: [authRequired, adminRequired, csrfProtection, require('../../middleware/csrfLocals.js')],
  getData: async function (req) {
    const products = await db.bindCategories(await db.bindPrimaryImage(await db.getArchived()));

    const flash = req.session?.flash;
    if (req.session) {
      delete req.session.flash;
    }
    return {
      products,
      flash,
    };
  }
});


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


      for (const r of rows) {

        r.email = await cache.wrap(`user_email:${r.user_id}`, 5 * 60 * 1000, async () => {
          const { data: users, error: usersErr } = await supabase.auth.admin.getUserById(r.user_id);
          if (usersErr) {
            console.error('Error fetching user for order:', usersErr);
            return null;
          }
          return users?.user.email || null;
        });
      }


      const fmtCurrency = (cents, currency = 'USD') =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((cents || 0) / 100);

      const orders = (rows || []).map((r) => ({
        ...r,
        placed_at_display: r.placed_at ? new Date(r.placed_at).toLocaleString() : '',
        total_display: fmtCurrency(r.total_cents, r.currency || 'USD'),
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
bind(router, {
  route: '/products/new',
  view: 'admin/products-new',
  meta: { title: 'Add Product' },
  middleware: [authRequired, adminRequired, csrfProtection, require('../../middleware/csrfLocals.js')],
  getData: async function (req) {
    // const products = await db.bindCategories(await db.bindPrimaryImage(await db.getAll()));

    const error = req.flash ? req.flash('error')[0] : null;
    const success = req.flash ? req.flash('success')[0] : null;

    return {
      product: null,
      mode: 'create',
      flash: { error, success },
    };
  }
});

bind(router, {
  route: '/products/:id/edit',
  view: 'admin/products-new',
  meta: { title: 'Edit Product' },
  middleware: [authRequired, adminRequired, csrfProtection, require('../../middleware/csrfLocals.js')],
  getData: async function (req, res) {

    const error = req.flash ? req.flash('error')[0] : null;
    const success = req.flash ? req.flash('success')[0] : null;
    const id = req.params.id;

    try {
      const product_list = [await db.getByID(id)];

      if (!product_list[0]) {
        console.error('Error loading product for edit:', error || 'Not found');
        req.flash?.('error', 'Product not found.');
        return {};
      }
      const product = (await db.bindImages(product_list))[0];

      return {
        product,
        mode: 'edit',
        flash: { error, success },
      };
    } catch {
      res.redirect('/admin/products');
      return {};
    }


  }
});






module.exports = router;