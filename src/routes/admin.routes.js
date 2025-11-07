const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { bind } = require('express-page-registry');
const db = require('../models/productDatabase.js');

const csrfProtection = csrf({ cookie: false });

bind(router, {
  route: '/products',
  view: 'admin/products',
  meta: { title: 'Products' },
  middleware: [csrfProtection, require('../middleware/csrfLocals')],
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
  middleware: [csrfProtection, require('../middleware/csrfLocals')],
  getData: async function (req) {
    const products = await db.bindCategories(await db.bindPrimaryImage(await db.getAll()));

    const error = req.flash ? req.flash('error')[0] : null;
    const success = req.flash ? req.flash('success')[0] : null;

    return {
      products,
      flash: { error, success },
    };
  }
});






module.exports = router;