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
  route: '/about',
  view: 'about',
  meta: { title: 'About' },
});

module.exports = router;