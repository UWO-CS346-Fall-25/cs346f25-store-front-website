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
  middleware: [csrfProtection],
  getData: async (req) => ({
    csrfToken: req.csrfToken(),
    allProducts: await productManager.getProducts(),
    featuredProducts: await productManager.getFeatured(),
    categories: await productManager.getCategories(),
    newArrivals: await productManager.getNewArrivals(8)
  })
});


bind(router, {
  route: '/contact',
  view: 'contact',
  meta: { title: 'Contact' },
  middleware: [csrfProtection],
  getData: async (req, res) => ({
    csrfToken: req.csrfToken()
  })
});

bind(router, {
  route: '/login',
  view: 'auth/login',
  meta: {
    title: 'Log in',
    description: 'Access your account to view orders and manage details.'
  },
  getData: async (req, _res) => ({
    // If you use connect-flash, this will feed flash messages to the view
    flash: {
      error: req.flash ? req.flash('error') : null
    }
    // csrfToken is injected by the binder if present
  })
});

bind(router, {
  route: '/signup',
  view: 'auth/signup',
  meta: {
    title: 'Signup',
    description: 'Create a new account to view orders and manage details.'
  },
  getData: async (req, _res) => ({
    flash: {
      error: req.flash ? req.flash('error') : null
    }
  })
});

module.exports = router;