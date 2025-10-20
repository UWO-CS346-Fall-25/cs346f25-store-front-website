const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { asyncWrap } = require("express-pretty-errors");
const { bind } = require('express-page-registry');

const csrfProtection = csrf({ cookie: false });

bind(router, {
  route: '/',
  view: 'home',
  meta: { title: 'Home' },
  middleware: [csrfProtection],
  getData: (req) => ({ csrfToken: req.csrfToken() })
});


bind(router, {
  route: '/contact',
  view: 'contact',
  meta: {
    title: 'Contact',
    description: 'Questions about an order or a custom item? Get in touch.'
  },
  nav: { label: 'Contact', order: 99, visible: true },
  getData: async (req, res) => ({
    flash: { success: req.flash?.('success'), error: req.flash?.('error') } // if using connect-flash
  })
});


module.exports = router;