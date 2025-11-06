const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { asyncWrap } = require("express-pretty-errors");
const { bind } = require('express-page-registry');
const productManager = require('../controllers/productController.js');


bind(router, {
  route: '/',
  view: 'home',
  meta: { title: 'Home' },
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
  getData: async (req, res) => ({
  })
});


module.exports = router;