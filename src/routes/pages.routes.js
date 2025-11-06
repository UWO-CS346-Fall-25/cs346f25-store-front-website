const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { asyncWrap } = require("express-pretty-errors");
const { bind } = require('express-page-registry');
const productManager = require('../controllers/productController.js');

const csrfProtection = csrf({ cookie: false });

bind(router, {
  route: '/',
  view: 'home',
  meta: { title: 'Home' },
  middleware: [csrfProtection, require('../middleware/csrfLocals')],
  getData: async (req) => ({
    featuredProducts: await productManager.getFeatured(),
    categories: await productManager.getCategories(),
    newArrivals: await productManager.getNewArrivals(8)
  })
});


bind(router, {
  route: '/contact',
  view: 'contact',
  meta: { title: 'Contact' },
  middleware: [csrfProtection, require('../middleware/csrfLocals')],
  getData: async (req, res) => ({
  })
});


module.exports = router;