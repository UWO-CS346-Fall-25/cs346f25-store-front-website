const express = require('express');
const router = express.Router();
const userDatabase = require('../../models/userDatabase');
const { genericClient, masterClient } = require('../../models/supabase');
const { bind } = require('express-page-registry');
const { authRequired } = require('../../middleware/accountRequired.js');


// =================================================
// =================== SECURITY ====================
// =================================================
bind(router, {
  route: '/security',
  view: 'account/security',
  meta: { title: 'Login & security' },
  middleware: [authRequired],
  getData: async function (req, res) {
    let ctx = await userDatabase.getUser(req);
    const email = ctx.user.email || '';
    return {
      ...ctx,
      errors: null,
      security: { email }
    };
  }
});



// =================================================
// =============== Change password =================
// =================================================
router.post('/security/password', authRequired, async (req, res, next) => {
  try {
    let ctx = await userDatabase.getUser(req);
    if (ctx.error) return next(ctx.errorDetail || new Error(ctx.error));

    const email = ctx.user.email;
    const userId = ctx.id;

    const body = req.body || {};
    const currentPassword = (body.currentPassword || '').trim();
    const newPassword = (body.newPassword || '').trim();
    const confirmPassword = (body.confirmPassword || '').trim();

    const errors = {};
    if (!currentPassword) errors.currentPassword = 'Current password is required';
    if (!newPassword) errors.newPassword = 'New password is required';
    if (newPassword && newPassword.length < 8) {
      errors.newPassword = 'New password must be at least 8 characters';
    }
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your new password';
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length) {
      console.log(errors);
      req.session.flash = { error: Object.values(errors)[0] };
      return res.redirect('/account/security');
      // return res.status(400).render('account/security', {
      //   ...ctx,
      //   security: { email },
      //   errors,
      //   title: 'Login & security',
      //   siteName: "Raven's Treasures",
      // });
    }

    // 1) Verify current password using generic (anon) client
    const supabaseAuth = genericClient(); // new client with anon key
    const { error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      console.error('Password verify failed:', signInError);
      errors.currentPassword = 'Current password is incorrect';
      return res.status(400).render('account/security', {
        ...ctx,
        security: { email },
        errors,
        title: 'Login & security',
        siteName: "Raven's Treasures",
      });
    }

    // 2) Update password via admin client
    const { error: updateErr } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateErr) {
      console.error('Error updating password:', updateErr);
      req.session.flash = { error: 'Could not update password. Please try again.' };
      return res.redirect('/account/security');
    }

    req.session.flash = { success: 'Password updated successfully.' };
    console.log("Successfull");
    res.redirect('/account/security');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
