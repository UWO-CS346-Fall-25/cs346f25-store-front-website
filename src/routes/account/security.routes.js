const express = require('express');
const router = express.Router();
const userDatabase = require('../../models/userDatabase');
const { genericClient, masterClient } = require('../../models/supabase');
const { bind } = require('express-page-registry');
const { authRequired } = require('../../middleware/accountRequired.js');
const errorManager = require('../../controllers/errorManager.js');
const dbStats = require('../../controllers/dbStats.js');


// =================================================
// =================== SECURITY ====================
// =================================================
bind(router, {
  route: '/security',
  view: 'account/security',
  meta: { title: 'Login & security' },
  middleware: [authRequired],
  getData: async function (req, res) {
    const flash = req.session?.flash || {};
    let ctx = await userDatabase.getUser(req);
    const email = ctx.user.email || '';
    return {
      ...ctx,
      errors: flash.errorList || {},
      security: { email }
    };
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

    errors.passwordChecker({ newAccount: false, currentPassword, newPassword, confirmPassword });

    if (errors.has()) return errors.throwError();

    // 1) Verify current password using generic (anon) client
    const supabaseAuth = genericClient(); // new client with anon key
    const { error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    dbStats.increment();
    if (errors.verify(signInError, 'currentPassword')) return errors.throwError();

    // 2) Update password via admin client
    const { error: updateErr } = await masterClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    dbStats.increment();
    if (errors.verify(updateErr)) return errors.throwError();

    return errors.throwSuccess('Password updated successfully.');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
