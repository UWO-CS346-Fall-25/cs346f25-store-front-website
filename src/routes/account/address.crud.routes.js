

const express = require('express');
const router = express.Router();
const userDatabase = require('../../models/userDatabase.js');
const errorManager = require('../../controllers/errorManager.js');

// =================================================
// ============== Create address ===================
// =================================================

router.post('/addresses/new', async (req, res, next) => {
  const errors = errorManager(req, res, next, { url: '/account/addresses/new' });
  try {
    let user = await userDatabase.getUser(req);
    errors.applyContext(user);
    if (errors.has()) return errors.throwCritical();

    const supabase = user.supabase;
    const userId = user.id;

    // Basic payload / validation
    const payload = {
      user_id: userId,
      label: (req.body.label || '').trim() || null,
      full_name: (req.body.full_name || '').trim(),
      line1: (req.body.line1 || '').trim(),
      line2: (req.body.line2 || '').trim() || null,
      city: (req.body.city || '').trim(),
      region: (req.body.region || '').trim() || null,
      postal_code: (req.body.postal_code || '').trim(),
      country_code: (req.body.country_code || '').trim().toUpperCase(),
      phone: (req.body.phone || '').trim() || null,
      is_default_shipping: !!req.body.is_default_shipping,
      is_default_billing: !!req.body.is_default_billing,
    };


    if (!payload.full_name) errors.addError('Full name is required', 'full_name');
    if (!payload.line1) errors.addError('Address line 1 is required', 'line1');
    if (!payload.city) errors.addError('City is required', 'city');
    if (!payload.postal_code) errors.addError('Postal code is required', 'postal_code');
    if (!payload.country_code) errors.addError('Country is required', 'country_code');
    if (errors.has()) return errors.throwError();

    // Insert new address
    const { data: rows, error } = await supabase
      .from('addresses')
      .insert(payload)
      .select('*')
      .single();

    if (errors.verify(error)) return errors.throwError();

    // If defaults set, clear others for this user
    const id = rows.id;

    if (payload.is_default_shipping) {
      await supabase
        .from('addresses')
        .update({ is_default_shipping: false })
        .eq('user_id', userId)
        .neq('id', id);
    }

    if (payload.is_default_billing) {
      await supabase
        .from('addresses')
        .update({ is_default_billing: false })
        .eq('user_id', userId)
        .neq('id', id);
    }

    return errors.throwSuccess('Address added.', '/account/addresses');
  } catch (err) {
    next(err);
  }
});




// =================================================
// ================ Update address =================
// =================================================

router.post('/addresses/:id/edit', async (req, res, next) => {
  const errors = errorManager(req, res, next, { url: `/account/addresses/${req.params.id}/edit` });
  try {
    const addressId = req.params.id;
    let user = await userDatabase.getUser(req);
    errors.applyContext(user);
    if (errors.has()) return errors.throwCritical();

    const { supabase, id: userId } = user;

    const payload = {
      label: (req.body.label || '').trim() || null,
      full_name: (req.body.full_name || '').trim(),
      line1: (req.body.line1 || '').trim(),
      line2: (req.body.line2 || '').trim() || null,
      city: (req.body.city || '').trim(),
      region: (req.body.region || '').trim() || null,
      postal_code: (req.body.postal_code || '').trim(),
      country_code: (req.body.country_code || '').trim().toUpperCase(),
      phone: (req.body.phone || '').trim() || null,
      is_default_shipping: !!req.body.is_default_shipping,
      is_default_billing: !!req.body.is_default_billing,
    };

    if (!payload.full_name) errors.addError('Full name is required', 'full_name');
    if (!payload.line1) errors.addError('Address line 1 is required', 'line1');
    if (!payload.city) errors.addError('City is required', 'city');
    if (!payload.postal_code) errors.addError('Postal code is required', 'postal_code');
    if (!payload.country_code) errors.addError('Country is required', 'country_code');
    if (errors.has()) return errors.throwError();

    const { error } = await supabase
      .from('addresses')
      .update(payload)
      .eq('id', addressId)
      .eq('user_id', userId);

    if (errors.verify(error)) return errors.throwError();

    // Fix defaults
    if (payload.is_default_shipping) {
      await supabase
        .from('addresses')
        .update({ is_default_shipping: false })
        .eq('user_id', userId)
        .neq('id', addressId);
    }

    if (payload.is_default_billing) {
      await supabase
        .from('addresses')
        .update({ is_default_billing: false })
        .eq('user_id', userId)
        .neq('id', addressId);
    }

    return errors.throwSuccess('Address updated.', '/account/addresses');
  } catch (err) {
    next(err);
  }
});




// =================================================
// ================ Delete address =================
// =================================================
router.post('/addresses/:id/delete', async (req, res, next) => {
  const errors = errorManager(req, res, next, { url: `/account/addresses` });
  try {
    const addressId = req.params.id;
    let user = await userDatabase.getUser(req);
    errors.applyContext(user);
    if (errors.has()) return errors.throwError();

    const { supabase, id: userId } = user;

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId);

    if (errors.verify(error)) return errors.throwError('This address cannot be deleted because it is attached to an order.');


    return errors.throwSuccess('Address deleted.');
  } catch (err) {
    next(err);
  }
});



// ==================================================
// ========== Set default shipping  =================
// ==================================================
router.post('/addresses/:id/default-shipping', async (req, res, next) => {
  const errors = errorManager(req, res, next, { url: `/account/addresses` });
  try {
    const addressId = req.params.id;
    let user = await userDatabase.getUser(req);
    errors.applyContext(user);
    if (errors.has()) return errors.throwError();

    const { supabase, id: userId } = user;

    await supabase
      .from('addresses')
      .update({ is_default_shipping: true })
      .eq('id', addressId)
      .eq('user_id', userId);

    await supabase
      .from('addresses')
      .update({ is_default_shipping: false })
      .eq('user_id', userId)
      .neq('id', addressId);

    return errors.throwSuccess('Default shipping address updated.');
  } catch (err) {
    next(err);
  }
});



// ==================================================
// =========== Set default billing ==================
// ==================================================
router.post('/addresses/:id/default-billing', async (req, res, next) => {
  const errors = errorManager(req, res, next, { url: `/account/addresses` });
  try {
    const addressId = req.params.id;
    let user = await userDatabase.getUser(req);
    errors.applyContext(user);
    if (errors.has()) return errors.throwError();

    const { supabase, id: userId } = user;

    await supabase
      .from('addresses')
      .update({ is_default_billing: true })
      .eq('id', addressId)
      .eq('user_id', userId);

    await supabase
      .from('addresses')
      .update({ is_default_billing: false })
      .eq('user_id', userId)
      .neq('id', addressId);

    return errors.throwSuccess('Default billing address updated.');
  } catch (err) {
    next(err);
  }
});


module.exports = router;
