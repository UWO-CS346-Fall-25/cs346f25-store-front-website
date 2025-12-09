const express = require('express');
const router = express.Router();
const userDatabase = require('../../models/userDatabase');
const { genericClient, masterClient } = require('../../models/supabase');
const { bind } = require('express-page-registry');
const { authRequired } = require('../../middleware/accountRequired.js');
const errorManager = require('../../controllers/errorManager.js');
const dbStats = require('../../controllers/dbStats.js');
const debug = require('../../controllers/debug.js')('Routes.Account.Security');

// =================================================
// =================== SECURITY ====================
// =================================================
bind(router, {
  route: '/security',
  view: 'account/security',
  meta: { title: 'Login & security' },
  middleware: [authRequired],
  getData: async function (req) {
    const flash = req.session?.flash || {};
    let ctx = await userDatabase.getUser(req);
    const email = ctx.user.email || '';
    const display_name = ctx.user.display_name || '';

    const data = {
      ...ctx,
      errors: flash.errorList || {},
      security: { email, display_name },
      user: req.user,
      flash,
    };

    return data;
  },
});

// =================================================
// =============== Change display name =============
// =================================================
router.post('/security/profile', authRequired, async (req, res, next) => {
  const errors = errorManager(req, res, next, { url: '/account/security' });

  try {
    let ctx = await userDatabase.getUser(req);
    errors.applyContext(ctx);
    if (errors.has()) return errors.throwCritical();

    const body = req.body || {};
    const display_name = (body.display_name || '').trim();

    if (!display_name) {
      errors.addError('Display name is required', 'display_name');
    }

    if (errors.has()) return errors.throwError();

    const userId = ctx.id;

    const { error: updateErr } = await masterClient().auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          ...(ctx.user.user_metadata || {}),
          display_name,
        },
      }
    );
    dbStats.increment();

    if (errors.verify(updateErr, 'display_nameUpdate')) {
      return errors.throwError();
    }

    if (req.user) {
      req.user.display_name = display_name;
    }

    return errors.throwSuccess('Display name updated.');
  } catch (err) {
    debug.log(err);
    next(err);
  }
});

// =================================================
// =============== Change email ====================
// =================================================
router.post('/security/email', authRequired, async (req, res, next) => {
  const errors = errorManager(req, res, next, { url: '/account/security' });

  try {
    let ctx = await userDatabase.getUser(req);
    errors.applyContext(ctx);
    if (errors.has()) return errors.throwCritical();

    const currentEmail = ctx.user.email;
    const userId = ctx.id;

    const body = req.body || {};
    const newEmail = (body.newEmail || '').trim().toLowerCase();
    const confirmEmail = (body.confirmEmail || '').trim().toLowerCase();
    const currentPassword = (body.currentPasswordEmail || '').trim();

    // Validation
    if (!newEmail) {
      errors.addError('New email is required', 'newEmail');
    }
    if (!confirmEmail) {
      errors.addError('Please confirm your new email', 'confirmEmail');
    }
    if (newEmail && confirmEmail && newEmail !== confirmEmail) {
      errors.addError('Emails do not match', 'confirmEmail');
    }
    if (!currentPassword) {
      errors.addError('Current password is required', 'currentPasswordEmail');
    }
    if (newEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) {
      errors.addError('Please enter a valid email address', 'newEmail');
    }

    if (errors.has()) return errors.throwError();

    // 1) Verify current password using generic (anon) client
    const supabaseAuth = genericClient();
    const { error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    });
    dbStats.increment();

    if (errors.verify(signInError, 'currentPasswordEmail')) {
      return errors.throwError();
    }

    // 2) Update email via admin client
    const { error: updateErr } = await masterClient().auth.admin.updateUserById(
      userId,
      { email: newEmail }
    );
    dbStats.increment();

    if (errors.verify(updateErr, 'emailUpdate')) {
      return errors.throwError();
    }

    if (req.user) {
      req.user.email = newEmail;
    }

    return errors.throwSuccess('Email updated.');
  } catch (err) {
    next(err);
  }
});

// =================================================
// =============== Change password =================
// =================================================
router.post('/security/password', authRequired, async (req, res, next) => {
  const errors = errorManager(req, res, next, { url: '/account/security' });
  try {
    let ctx = await userDatabase.getUser(req);
    errors.applyContext(ctx);
    if (errors.has()) return errors.throwCritical();

    const email = ctx.user.email;
    const userId = ctx.id;

    const body = req.body || {};
    const currentPassword = (body.currentPassword || '').trim();
    const newPassword = (body.newPassword || '').trim();
    const confirmPassword = (body.confirmPassword || '').trim();

    errors.passwordChecker({
      newAccount: false,
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (errors.has()) return errors.throwError();

    // 1) Verify current password using generic (anon) client
    const supabaseAuth = genericClient(); // new client with anon key
    const { error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    dbStats.increment();
    if (errors.verify(signInError, 'currentPassword'))
      return errors.throwError();

    // 2) Update password via admin client
    const { error: updateErr } = await masterClient().auth.admin.updateUserById(
      userId,
      {
        password: newPassword,
      }
    );
    dbStats.increment();
    if (errors.verify(updateErr)) return errors.throwError();

    return errors.throwSuccess('Password updated successfully.');
  } catch (err) {
    next(err);
  }
});

module.exports = router;

module.exports = router;
