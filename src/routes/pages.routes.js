const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { bind } = require('express-page-registry');
const db = require('../models/productDatabase.js');

const csrfProtection = csrf({ cookie: false });
const { authRequired } = require('../middleware/accountRequired');
const { authClient } = require('../models/supabase');
const dbStats = require('../controllers/dbStats');

bind(router, {
  route: '/',
  view: 'home',
  meta: { title: 'Home' },
  middleware: [csrfProtection, require('../middleware/csrfLocals')],
  getData: async () => ({
    featuredProducts: await db.bindPrimaryImage(await db.getFeatured()),
    categories: await db.categoryBindProductAndPrimaryImage(await db.getCategories()),
    newArrivals: await db.bindPrimaryImage(await db.getNewArrivals(8)),
  })
});



router.get('/contact', csrfProtection, require('../middleware/csrfLocals'), (req, res) => {
  if (!req.user) {
    res.redirect('/contact/email');
  } else {
    res.redirect('/messages');
  }
});


bind(router, {
  route: '/contact/email',
  view: 'messages/contact',
  meta: { title: 'Contact' },
  middleware: [csrfProtection, require('../middleware/csrfLocals')],
  getData: async (_, __) => ({
  })
});


bind(router, {
  route: '/messages',
  view: 'messages/inbox',
  meta: { title: 'Messages', messages: [] },
  middleware: [authRequired, csrfProtection, require('../middleware/csrfLocals')],
  getData: async (req, res) => {
  }
});


module.exports = router;