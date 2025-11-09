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
    } catch (err) {
      console.error('Unexpected error loading product for edit:', err);
      res.redirect('/admin/products');
      return {};
    }


  }
});






module.exports = router;