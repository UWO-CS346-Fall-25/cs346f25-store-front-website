

const express = require('express');
const router = express.Router();
const { bind } = require('express-page-registry');
const { authRequired } = require('../middleware/accountRequired.js');
const { authClient } = require('../models/supabase');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: false });
const userDatabase = require('../models/userDatabase.js');


const fmtCurrency = (cents, currency = 'USD', locale = 'en-US') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format((cents || 0) / 100);

const statusLabel = (s) => {
  if (!s) return 'Unknown';
  const map = {
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    canceled: 'Canceled',
    cancelled: 'Canceled', // safety
    refunded: 'Refunded',
    on_hold: 'On hold',
  };
  return map[s.toLowerCase()] || s;
};

const isOpenStatus = (s) => ['processing', 'shipped', 'on_hold'].includes(String(s || '').toLowerCase());


bind(router, {
  route: '/account',
  view: 'account/overview',
  meta: { title: 'Account Overview' },
  middleware: [authRequired, csrfProtection, require('../middleware/csrfLocals')],
  getData: async function (req) {
    let user = await userDatabase.getUser(req);
    user = await userDatabase.bindAddresses(user);
    user = await userDatabase.bindOrderSummary(user);

    return user;
  }
});


bind(router, {
  route: '/account/orders',
  view: 'account/orders',
  meta: { title: 'Orders' },
  middleware: [authRequired, csrfProtection, require('../middleware/csrfLocals')],
  getData: async function (req, res) {
    let user = await userDatabase.getUser(req);

    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const status = (req.query.status || '').trim();   // '', 'processing', 'shipped', 'delivered', etc.
    const q = (req.query.q || '').trim();             // order number search

    user = await userDatabase.bindOrders(user, { page, status, q });

    return user;

  }

});

bind(router, {
  route: '/account/orders/:orderId',
  view: 'account/order-details',
  meta: { title: 'Order Details' },
  middleware: [authRequired, csrfProtection, require('../middleware/csrfLocals')],
  getData: async function (req, res) {

    const { orderId } = req.params;

    let user = await userDatabase.getUser(req);
    user = await userDatabase.bindOrderDetail(user, orderId);

    if (user.notFound) {
      res.status(404);
      return res.render('errors/404', { message: 'Order not found', user }); // or however you do 404
    }

    if (user.error) {
      return next(user.errorDetail || new Error(user.error));
    }
    return user;
  }
})




module.exports = router;