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
  getData: async (_) => ({
    featuredProducts: await db.bindPrimaryImage(await db.getFeatured()),
    categories: await db.categoryBindProductAndPrimaryImage(await db.getCategories()),
    newArrivals: await db.bindPrimaryImage(await db.getNewArrivals(8)),
  })
});


bind(router, {
  route: '/contact',
  view: 'messages/contact',
  meta: { title: 'Contact' },
  middleware: [csrfProtection, require('../middleware/csrfLocals')],
  getData: async (_, __) => ({
  })
});


bind(router, {
  route: '/messages',
  view: 'messages/inbox',
  meta: { title: 'Messages' },
  middleware: [authRequired, csrfProtection, require('../middleware/csrfLocals')],
  getData: async (req, res) => {
    try {
      const client = authClient(req);
      const { data, error } = await client
        .from('messages')
        .select('id,is_from_user,body,created_at')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Supabase fetch messages error', error);
        return { messages: [] };
      }
      dbStats.increment(data.length);
      return { messages: data || [] };
    } catch (err) {
      console.error('Failed to load messages', err);
      return { messages: [] };
    }
  }
});


module.exports = router;