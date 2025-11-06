const express = require('express');
const supabase = require('../models/supabase');

function getFlash(req) {
  return req.flash ? { error: req.flash('error')[0] } : {};
}

module.exports = function (csrfProtection) {
  const router = express.Router();

  // GET /auth/login
  router.get('/login', csrfProtection, (req, res) => {
    res.render('auth/login', {
      csrfToken: req.csrfToken(),
      flash: getFlash(req),
    });
  });

  // POST /auth/login
  router.post('/login', csrfProtection, async (req, res) => {
    console.log('BODY._csrf:', req.body._csrf);
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
        csrfToken: req.csrfToken(),
        flash: { error: 'Invalid email or password' },
      });
    }

    const { access_token, refresh_token, user } = data.session;

    const oneHour = 60 * 60 * 1000;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const accessMaxAge = remember ? oneHour * 12 : oneHour;
    const refreshMaxAge = remember ? sevenDays : oneHour * 24;

    res.cookie('sb-access-token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: accessMaxAge,
    });

    res.cookie('sb-refresh-token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshMaxAge,
    });

    res.cookie('user-display-name', user.user_metadata?.display_name || '', {
      httpOnly: false,
      sameSite: 'lax',
    });

    res.redirect('/');
  });

  // POST /auth/logout
  router.post('/logout', csrfProtection, (req, res) => {
    res.clearCookie('sb-access-token');
    res.clearCookie('sb-refresh-token');
    res.clearCookie('user-display-name');
    res.redirect('/');
  });

  return router;
};
