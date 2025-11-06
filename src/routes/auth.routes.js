const express = require('express');
const router = express.Router();
const supabase = require('../models/supabase');

const csrf = require('csurf');
const csrfProtection = csrf();

// Helper for flash-like object
function getFlash(req) {
  return req.flash ? { error: req.flash('error')[0] } : {};
}

// GET /auth/login – render the page
router.get('/login', csrfProtection, (req, res) => {
  res.render('auth/login', {
    csrfToken: req.csrfToken(),
    flash: getFlash(req),
  });
});

// POST /auth/login – actually log in with Supabase
router.post('/login', csrfProtection, express.urlencoded({ extended: false }), async (req, res) => {
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




  // Set HTTP-only cookies so the browser can't read them via JS
  const oneHour = 60 * 60 * 1000;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const accessMaxAge = remember ? oneHour * 12 : oneHour; // example: 12h if "remember me"
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

  // Optional: non-httpOnly cookie for showing name in UI
  res.cookie('user-display-name', user.user_metadata?.display_name || '', {
    httpOnly: false,
    sameSite: 'lax',
  });

  // Redirect somewhere sensible
  res.redirect('/');
});

// POST /auth/logout – clear cookies
router.post('/logout', (req, res) => {
  res.clearCookie('sb-access-token');
  res.clearCookie('sb-refresh-token');
  res.clearCookie('user-display-name');
  res.redirect('/');
});

module.exports = router;
