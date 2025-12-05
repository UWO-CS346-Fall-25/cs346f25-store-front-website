

const express = require('express');
const router = express.Router();
const { bind } = require('express-page-registry');
const { authRequired } = require('../../middleware/accountRequired.js');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: false });
const userDatabase = require('../../models/userDatabase.js');
const csrfLocals = require('../../middleware/csrfLocals');


bind(router, {
  route: '/',
  view: 'account/overview',
  meta: { title: 'Account Overview' },
  middleware: [authRequired, csrfProtection, csrfLocals],
  getData: async function (req) {
    let user = await userDatabase.getUser(req);
    // user = await userDatabase.bindAddresses(user);
    user = await userDatabase.bindOrderSummary(user);

    return { ...user, user: req.user };
  }
});


bind(router, {
  route: '/orders',
  view: 'account/orders',
  meta: { title: 'Orders' },
  middleware: [authRequired, csrfProtection, csrfLocals],
  getData: async function (req, res) {
    let user = await userDatabase.getUser(req);

    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const status = (req.query.status || '').trim();   // '', 'processing', 'shipped', 'delivered', etc.
    const q = (req.query.q || '').trim();             // order number search

    user = await userDatabase.bindOrders(user, { page, status, q });

    return { ...user, user: req.user };

  }

});

bind(router, {
  route: '/orders/:orderId',
  view: 'account/order-details',
  meta: { title: 'Order Details' },
  middleware: [authRequired, csrfProtection, csrfLocals],
  getData: async function (req, res) {

    const { orderId } = req.params;

    let user = await userDatabase.getUser(req);
    user = await userDatabase.bindOrderDetail(user, orderId);

    if (user.notFound) {
      res.status(404);
      return res.render('errors/404', { message: 'Order not found', user });
    }

    if (user.error) {
      return next(user.errorDetail || new Error(user.error));
    }
    return { ...user, user: req.user };
  }
});








module.exports = router;