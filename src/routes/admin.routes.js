const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { bind } = require('express-page-registry');
const db = require('../models/productDatabase.js');
const { authClient } = require('../models/supabase.js');
const { authRequired } = require('../middleware/accountRequired.js');

const csrfProtection = csrf({ cookie: false });

bind(router, {
  route: '/products',
  view: 'admin/products',
  meta: { title: 'Products' },
  middleware: [authRequired, csrfProtection, require('../middleware/csrfLocals')],
  getData: async function (req) {
    const products = await db.bindCategories(await db.bindPrimaryImage(await db.getAll()));

    return {
      products,
    };
  }
});
bind(router, {
  route: '/products/new',
  view: 'admin/products-new',
  meta: { title: 'Add Product' },
  middleware: [authRequired, csrfProtection, require('../middleware/csrfLocals')],
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
  middleware: [authRequired, csrfProtection, require('../middleware/csrfLocals')],
  getData: async function (req, res) {

    const error = req.flash ? req.flash('error')[0] : null;
    const success = req.flash ? req.flash('success')[0] : null;
    const id = req.params.id;

    try {
      const product = await db.getByID(id);

      if (!product) {
        console.error('Error loading product for edit:', error || 'Not found');
        req.flash?.('error', 'Product not found.');
        return {};
      }

      res.render('admin/products-new', {
        csrfToken: req.csrfToken(),
        product,
        mode: 'edit',
        flash: {
          error: req.flash?.('error'),
          success: req.flash?.('success'),
        },
      });

      return {
        product,
        mode: 'edit',
        flash: { error, success },
      };
    } catch (err) {
      console.error('Unexpected error loading product for edit:', err);
      res.redirect('/admin/products');
      return {};
    }


  }
});






module.exports = router;