const express = require('express');
const supabase = require('../models/supabase');
const { bind } = require('express-page-registry');

module.exports = function (csrfProtection) {
  const router = express.Router();

  bind(router, {
    route: '/login',
    view: 'auth/login',
    meta: {
      title: 'Log in',
      description: 'Access your account to view orders and manage details.'
    },
    middleware: [csrfProtection],
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
    middleware: [csrfProtection],
    getData: async (req, _res) => ({
      flash: {
        error: req.flash ? req.flash('error') : null
      }
    })
  });


  return router;
};
