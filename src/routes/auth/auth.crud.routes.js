const express = require('express');
const { authClient } = require('../../models/supabase');
const dbStats = require('../../controllers/dbStats');

module.exports = function (csrfProtection) {
  const router = express.Router();

  // POST /auth/login
  router.post('/login', csrfProtection, async (req, res) => {
    const supabase = authClient(req);
    const { email, password, remember } = req.body;

    const rememberMe =
      remember === '1' ||
      remember === 'on' ||
      remember === true ||
      remember === 'true';

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    dbStats.increment();

    if (error || !data?.session) {
      if (req.flash) {
        req.flash('error', 'Invalid email or password');
        return res.redirect('/login');
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
      refreshCookieOptions.maxAge = sevenDays; // 7 days
    }

    // If rememberMe is false, no maxAge ⇒ session cookie
    res.cookie('sb-access-token', access_token, accessCookieOptions);
    res.cookie('sb-refresh-token', refresh_token, refreshCookieOptions);

    res.cookie('user-display-name', user.user_metadata?.display_name || '', {
      httpOnly: false,
      sameSite: 'lax',
    });

    const redirectTo = (req.session && req.session.returnTo) || '/';
    if (redirectTo === '/login') redirectTo = '/';

    if (req.session) {
      delete req.session.returnTo; // clean it up so it doesn’t stick around
    }

    res.redirect(redirectTo);
  });

  // POST /auth/signup
  router.post('/signup', csrfProtection, async (req, res) => {
    const supabase = authClient(req);
    const { name, email, password, terms } = req.body;

    // Terms required (HTML also enforces this, but we double-check server-side)
    if (!terms) {
      if (req.flash) {
        req.flash('error', 'You must agree to the Terms and Privacy Policy.');
        return res.redirect('/signup');
      }

      return res.status(400).render('auth/signup', {
        flash: { error: 'You must agree to the Terms and Privacy Policy.' },
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
          role: 'user',
        },
      },
    });
    dbStats.increment();

    if (error) {
      if (req.flash) {
        req.flash('error', error.message || 'Unable to create account.');
        return res.redirect('/signup');
      }

      return res.status(400).render('auth/signup', {
        flash: { error: error.message || 'Unable to create account.' },
      });
    }

    // Supabase behavior depends on your email confirmation setting:
    // - If email confirmation disabled : data.session will be present
    // - If email confirmation enabled : data.session will be null and user must confirm via email
    const session = data.session;

    // If we got a session, treat this like an immediate login
    if (session) {
      const { access_token, refresh_token, user } = session;

      const oneHour = 60 * 60 * 1000;
      const accessMaxAge = oneHour;
      const refreshMaxAge = oneHour * 24;

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

      res.cookie('user-display-name', user?.user_metadata?.display_name || '', {
        httpOnly: false,
        sameSite: 'lax',
      });

      const redirectTo = (req.session && req.session.returnTo) || '/';
      if (req.session) {
        delete req.session.returnTo;
      }

      return res.redirect(redirectTo);
    }

    // No session : likely email confirmation required
    if (req.flash) {
      req.flash(
        'error',
        'Account created. Please check your email to confirm your address before logging in.'
      );
      return res.redirect('/login');
    }

    return res.status(200).render('auth/login', {
      flash: {
        error:
          'Account created. Please check your email to confirm your address before logging in.',
      },
    });
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
