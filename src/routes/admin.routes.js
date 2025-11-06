const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { bind } = require('express-page-registry');
const productDB = require('../models/productDatabase.js');

const csrfProtection = csrf({ cookie: false });

bind(router, {
  route: '/products',
  view: 'admin/products',
  meta: { title: 'Products' },
  middleware: [csrfProtection, require('../middleware/csrfLocals')],
  getData: async (req) => ({
    products: await productDB.getAllProductsWithMainImage(),
  })
});


module.exports = router;