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
