const express = require('express');
const { bind } = require('express-page-registry');

function getFlash(req) {
  return req.flash ? { error: req.flash('error')[0] } : {};
}


module.exports = function (csrfProtection) {
  const router = express.Router();

  bind(router, {
    route: '/login',
    view: 'auth/login',
    meta: {
      title: 'Log in',
      description: 'Access your account to view orders and manage details.'
    },
    middleware: [csrfProtection, require('../../middleware/csrfLocals')],
    getData: async (req, _res) => ({
      flash: getFlash(req),
    })
  });

  bind(router, {
    route: '/signup',
    view: 'auth/signup',
    meta: {
      title: 'Signup',
      description: 'Create a new account to view orders and manage details.'
    },
    middleware: [csrfProtection, require('../../middleware/csrfLocals')],
    getData: async (req, _res) => ({
      flash: getFlash(req),
    })
  });


  return router;
};
