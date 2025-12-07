const express = require('express');
const router = express.Router();
const { bind } = require('express-page-registry');
const { authRequired } = require('../../middleware/accountRequired.js');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: false });
const userDatabase = require('../../models/userDatabase.js');
const csrfLocals = require('../../middleware/csrfLocals.js');
const errorManager = require('../../controllers/errorManager.js');
const dbStats = require('../../controllers/dbStats.js');

bind(router, {
  route: '/profile',
  view: 'account/profile',
  meta: { title: 'Account Profile' },
  middleware: [authRequired, csrfProtection, csrfLocals],
  getData: async function (req, _, next) {
    const flash = req.session?.flash || {};
    let ctx = await userDatabase.getUser(req);
    if (ctx.error) return next(ctx.errorDetail || new Error(ctx.error));

    const profile = {
      firstName: ctx.user.firstName || '',
      lastName: ctx.user.lastName || '',
      email: ctx.user.email || '',
      displayName: ctx.user.displayName || '',
      phone: ctx.user.phone || '',
      newsletter: !!ctx.user.newsletterOptIn,
    };

    return {
      ...ctx,
      profile,
      errors: flash.errorList || {},
    };
  },
});

router.post('/profile', authRequired, async (req, res, next) => {
  const errors = errorManager(req, res, next, { url: '/account/profile' });
  try {
    let user = await userDatabase.getUser(req);
    errors.applyContext(user);
    if (errors.has()) return errors.throwCritical();

    const supabase = require('../../models/supabase.js').masterClient();
    const body = req.body || {};

    const profile = {
      firstName: (body.firstName || '').trim(),
      lastName: (body.lastName || '').trim(),
      displayName: (body.displayName || '').trim(),
      phone: (body.phone || '').trim(),
      newsletter: !!body.newsletter,
    };

    // Make names optional or required as you prefer:
    if (!profile.firstName)
      errors.addError('First name is required', 'firstName');
    if (!profile.lastName) errors.addError('Last name is required', 'lastName');

    if (errors.has()) return errors.throwError();

    // Update auth user metadata in Supabase
    // Adjust keys here to match how you want to store them in user_metadata
    const { error: updateErr } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          displayName: profile.displayName || null,
          phone: profile.phone || null,
          newsletter_opt_in: profile.newsletter,
        },
      }
    );
    dbStats.increment();

    if (errors.verify(updateErr, 'profileUpdate')) return errors.throwError();

    // Optionally: also update any local session copy of req.user
    if (req.user) {
      req.user.firstName = profile.firstName;
      req.user.lastName = profile.lastName;
      req.user.displayName = profile.displayName;
      req.user.phone = profile.phone;
      req.user.newsletter_opt_in = profile.newsletter;
    }
    return errors.throwSuccess('Profile updated.');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
