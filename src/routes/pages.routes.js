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
  meta: { title: 'Contact' },
  middleware: [csrfProtection],
  getData: async (req, res) => ({
    csrfToken: req.csrfToken()
  })
});


module.exports = router;