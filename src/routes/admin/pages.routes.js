const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { bind } = require('express-page-registry');
const db = require('../../models/productDatabase.js');
const { masterClient } = require('../../models/supabase.js');
const { authRequired, adminRequired } = require('../../middleware/accountRequired.js');
const dbStats = require('../../controllers/dbStats.js');

const csrfProtection = csrf({ cookie: false });

const logs = require('../../controllers/debug.js');
const utilities = require('../../models/admin-utilities.js');

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
    try {
      const utilList = require('../../models/admin-utilities.js');
      const supabase = require('../../models/supabase.js').masterClient();
      const fs = require('fs').promises;

      // Compute a few useful counts for dashboard badges
      let pendingOrdersCount = 0;
      try {
        const { error, count } = await supabase
          .from('orders_view')
          .select('id', { count: 'exact', head: true })
          .in('status', ['processing', 'packed', 'awaiting_shipment']);
        dbStats.increment();
        if (!error && typeof count === 'number') pendingOrdersCount = count;
      } catch (e) {
        console.error('Error counting pending orders for dashboard:', e);
      }

      // Logs count (use debug controller).
      // Count only errors that have NOT been marked as viewed in the current session.
      let logsCount = 0;
      let logsErrorCount = 0;
      try {
        const logs = require('../../controllers/debug.js');
        const all = logs.getAllLogs();
        logsCount = Array.isArray(all) ? all.length : 0;
        // get set of already-viewed log ids from session (persist per admin session)
        const viewedSet = new Set((req.session && Array.isArray(req.session.viewedLogs)) ? req.session.viewedLogs : []);
        if (Array.isArray(all)) {
          logsErrorCount = all.filter(e => String(e.level || '').toLowerCase() === 'error' && !viewedSet.has(e.id)).length;
        }
      } catch (e) {
        console.error('Error computing logs count for dashboard:', e);
      }

      // TODO count: count unchecked list items in docs/TODO.md
      let todoOpenCount = 0;
      try {
        const todoPath = require('path').join(__dirname, '..', '..', 'docs', 'TODO.md');
        const md = await fs.readFile(todoPath, { encoding: 'utf8' });
        if (md) {
          const matches = md.match(/- \[ \]/g);
          todoOpenCount = matches ? matches.length : 0;
        }
      } catch (e) {
        // ignore if file not present
      }

      // Count draft products for Products Manager badge
      let draftProductsCount = 0;
      try {
        const database = require('../../models/db.js');
        const r = await database.query("SELECT COUNT(*) AS cnt FROM public.products WHERE status = 'draft'");
        dbStats.increment();
        if (r && r.rows && r.rows[0]) {
          draftProductsCount = Number(r.rows[0].cnt) || 0;
        }
      } catch (e) {
        console.error('Error counting draft products for dashboard:', e);
      }

      const utilities = utilList.map(u => {
        const copy = Object.assign({}, u);
        if (copy.id === 'orders') copy.count = pendingOrdersCount || 0;
        else if (copy.id === 'products') {
          // show number of drafts on Products Manager
          copy.count = draftProductsCount || 0;
        }
        else if (copy.id === 'logs') {
          // For logs we provide both overall count and errorCount; show error badge for errors
          copy.count = logsCount || 0;
          copy.errorCount = logsErrorCount || 0;
        }
        else if (copy.id === 'todo') copy.count = todoOpenCount || 0;
        else copy.count = 0;
        return copy;
      });

      return { flash, utilities };
    } catch (err) {
      console.error('Error preparing admin dashboard data:', err);
      return { flash, utilities: require('../../models/admin-utilities.js') };
    }
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
        dbStats.increment();

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
        dbStats.increment();
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
          if (d.indexOf('\n') !== -1) {
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

    // Mark any error-level logs present on this page as viewed for this session
    try {
      if (req.session) {
        const viewed = new Set(req.session.viewedLogs || []);
        for (const e of normalized) {
          if (String(e.level || '').toLowerCase() === 'error') viewed.add(e.id);
        }
        req.session.viewedLogs = Array.from(viewed);
      }
    } catch (e) {
      // don't block on session errors
      console.error('Error marking logs as viewed in session:', e);
    }

    return {
      flash,
      logs: normalized,
    };
  }
});

// Admin TODO viewer (renders docs/TODO.md)
bind(router, {
  route: '/todo',
  view: 'admin/todo',
  meta: { title: 'Admin TODO' },
  middleware: [authRequired, adminRequired, csrfProtection, require('../../middleware/csrfLocals.js')],
  getData: async function (req) {
    const flash = req.session?.flash;
    if (req.session) {
      delete req.session.flash;
    }
    try {
      const todoController = require('../../controllers/todoController.js');
      const todoHtml = await todoController.getTodoHtml();
      return { flash, todoHtml };
    } catch (err) {
      console.error('Error loading TODO viewer:', err);
      return { flash, todoHtml: '<p>Unable to load TODO content.</p>' };
    }
  }
});

// Admin: Cache viewer
bind(router, {
  route: '/cache',
  view: 'admin/cache',
  meta: { title: 'Cache' },
  middleware: [authRequired, adminRequired, csrfProtection, require('../../middleware/csrfLocals.js')],
  getData: async function (req) {
    const flash = req.session?.flash;
    if (req.session) delete req.session.flash;
    try {
      const cache = require('../../controllers/cache.js');
      const raw = cache.listKeys(); // [{key, exp}]
      const items = raw.map(entry => {
        const key = entry.key;
        const exp = entry.exp || 0;
        const now = Date.now();
        const ttlRemaining = exp === 0 ? null : Math.max(0, exp - now);
        let preview = null;
        try {
          const val = cache.get(key);
          if (val == null) preview = null;
          else if (typeof val === 'string') {
            // If it's a JSON string, pretty-print it
            try {
              const parsed = JSON.parse(val);
              preview = JSON.stringify(parsed, null, 2);
            } catch (e) {
              preview = val;
            }
          } else {
            try {
              preview = JSON.stringify(val, null, 2);
            } catch (e) {
              preview = String(val);
            }
          }
        } catch (e) {
          preview = '<unserializable>';
        }
        // Truncate very large previews to avoid rendering huge blocks in the admin UI
        if (typeof preview === 'string' && preview.length > 2000) preview = preview.substring(0, 2000) + '\n…(truncated)';
        return { key, exp, ttlRemaining, preview };
      });

      return { flash, items };
    } catch (err) {
      console.error('Error preparing cache admin page:', err);
      return { flash, items: [] };
    }
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
