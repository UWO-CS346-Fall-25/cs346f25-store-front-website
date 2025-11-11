const express = require('express');
const { authClient } = require('../models/supabase');

function getFlash(req) {
  return req.flash ? { error: req.flash('error')[0] } : {};
}

module.exports = function (csrfProtection) {
  const router = express.Router();

  // GET /auth/login
  router.get('/login', csrfProtection, (req, res) => {
    res.render('auth/login', {
      flash: getFlash(req),
    });
  });

  // POST /auth/login
  router.post('/login', csrfProtection, async (req, res) => {
    const supabase = authClient(req);
    const { email, password, remember } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.session) {
      if (req.flash) {
        req.flash('error', 'Invalid email or password');
        return res.redirect('/auth/login');
      }

      return res.status(401).render('auth/login', {
        flash: { error: 'Invalid email or password' },
      });
    }

    const { access_token, refresh_token, user } = data.session;
    const oneHour = 60 * 60 * 1000;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    const commonCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    };

    const accessCookieOptions = { ...commonCookieOptions };
    const refreshCookieOptions = { ...commonCookieOptions };

    // Only set maxAge if user wants to be remembered
    if (rememberMe) {
      accessCookieOptions.maxAge = oneHour * 12; // 12 hours
      refreshCookieOptions.maxAge = sevenDays;   // 7 days
    }

    // If rememberMe is false, no maxAge ⇒ session cookie
    res.cookie('sb-access-token', access_token, accessCookieOptions);
    res.cookie('sb-refresh-token', refresh_token, refreshCookieOptions);

    res.cookie('user-display-name', user.user_metadata?.display_name || '', {
      httpOnly: false,
      sameSite: 'lax',
    });


    const redirectTo = (req.session && req.session.returnTo) || '/';

    if (req.session) {
      delete req.session.returnTo; // clean it up so it doesn’t stick around
    }

    res.redirect(redirectTo);
  });

  // POST /auth/logout
  router.post('/logout', csrfProtection, (req, res) => {
    res.clearCookie('sb-access-token');
    res.clearCookie('sb-refresh-token');
    res.clearCookie('user-display-name');
    if (req.session) {
      req.session.user = null;
    }

    res.redirect('/');
  });



  return router;
};
