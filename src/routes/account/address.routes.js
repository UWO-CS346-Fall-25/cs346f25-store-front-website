
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


// =================================================
// ================ Edit address ===================
// =================================================

bind(router, {
  route: '/addresses/:id/edit',
  view: 'account/address-form',
  meta: { title: 'Edit Address' },
  middleware: [authRequired, csrfProtection, csrfLocals],
  getData: async function (req, res, next) {
    const errors = errorManager(req, res, next, { url: `/account/addresses` });
    const addressId = req.params.id;
    let user = await userDatabase.getUser(req);
    errors.applyContext(user);

    if (errors.has()) return errors.throwError();

    const { supabase, id: userId } = user;

    const { data: address, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', addressId)
      .eq('user_id', userId)
      .maybeSingle();
    dbStats.increment();

    if (errors.verify(error)) return errors.throwError();
    if (!address) return errors.throwError('Address not found.');

    return {
      ...user,
      formAction: `/account/addresses/${addressId}/edit`,
      isEdit: true,
      address,
      errors: null,
    }
  }
});



// =================================================
// ============== Addresses list ===================
// =================================================

bind(router, {
  route: '/addresses',
  view: 'account/addresses',
  meta: { title: 'Addresses' },
  middleware: [authRequired, csrfProtection, csrfLocals],
  getData: async function (req, res, next) {
    const errors = errorManager(req, res, next);
    let user = await userDatabase.getUser(req);
    errors.applyContext(user);
    if (errors.has()) return errors.throwCritical();
    user = await userDatabase.bindAddressesList(user);
    if (user.error) return errors.throwError(user.error);

    return user;
  }
});

// =================================================
// ============== New address ======================
// =================================================
bind(router, {
  route: '/addresses/new',
  view: 'account/address-form',
  middleware: [authRequired, csrfProtection, csrfLocals],
  meta: { title: 'Add New Address' },
  getData: async function (req, res, next) {
    const errors = errorManager(req, res, next);
    let user = await userDatabase.getUser(req);
    if (errors.applyContext(user)) return errors.throwCritical();

    if (user.error) return errors.throwError(user.error);

    return {
      ...user,
      formAction: '/account/addresses/new',
      isEdit: false,
      address: null,
      errors: null,
    };
  }
});

module.exports = router;
