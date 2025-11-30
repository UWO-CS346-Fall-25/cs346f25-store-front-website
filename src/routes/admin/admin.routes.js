const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { bind } = require('express-page-registry');
const db = require('../../models/productDatabase.js');
const { authRequired } = require('../../middleware/accountRequired.js');

const csrfProtection = csrf({ cookie: false });

const logs = require('../../controllers/debug.js');
const utilities = require('../../models/admin-utilities.js');

bind(router, {
  route: '/',
  view: 'admin/dashboard',
  middleware: [authRequired, csrfProtection, require('../../middleware/csrfLocals.js')],
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
  route: '/logs',
  view: 'admin/logs',
  middleware: [authRequired, csrfProtection, require('../../middleware/csrfLocals.js')],
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
  middleware: [authRequired, csrfProtection, require('../../middleware/csrfLocals.js')],
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
  middleware: [authRequired, csrfProtection, require('../../middleware/csrfLocals.js')],
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
  middleware: [authRequired, csrfProtection, require('../../middleware/csrfLocals.js')],
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
  middleware: [authRequired, csrfProtection, require('../../middleware/csrfLocals.js')],
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