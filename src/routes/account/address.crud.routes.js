

const express = require('express');
const router = express.Router();
const userDatabase = require('../../models/userDatabase.js');


// =================================================
// ============== Create address ===================
// =================================================

router.post('/addresses/new', async (req, res, next) => {
  try {
    let user = await userDatabase.getUser(req);
    if (user.error) return next(user.errorDetail || new Error(user.error));

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

    const errors = {};
    if (!payload.full_name) errors.full_name = 'Full name is required';
    if (!payload.line1) errors.line1 = 'Address line 1 is required';
    if (!payload.city) errors.city = 'City is required';
    if (!payload.postal_code) errors.postal_code = 'Postal code is required';
    if (!payload.country_code) errors.country_code = 'Country is required';

    if (Object.keys(errors).length) {
      return res.status(400).render('account/address-form', {
        ...user,
        pageTitle: 'Add address',
        formAction: '/account/addresses/new',
        isEdit: false,
        address: payload,
        errors,
      });
    }

    // Insert new address
    const { data: rows, error } = await supabase
      .from('addresses')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating address:', error);
      req.session.flash = { error: 'Could not create address.' };
      return res.redirect('/account/addresses');
    }

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

    req.session.flash = { success: 'Address added.' };
    res.redirect('/account/addresses');
  } catch (err) {
    next(err);
  }
});




// =================================================
// ================ Update address =================
// =================================================

router.post('/addresses/:id/edit', async (req, res, next) => {
  try {
    const addressId = req.params.id;
    let user = await userDatabase.getUser(req);
    if (user.error) return next(user.errorDetail || new Error(user.error));

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

    const errors = {};
    if (!payload.full_name) errors.full_name = 'Full name is required';
    if (!payload.line1) errors.line1 = 'Address line 1 is required';
    if (!payload.city) errors.city = 'City is required';
    if (!payload.postal_code) errors.postal_code = 'Postal code is required';
    if (!payload.country_code) errors.country_code = 'Country is required';

    if (Object.keys(errors).length) {
      return res.status(400).render('account/address-form', {
        ...user,
        pageTitle: 'Edit address',
        formAction: `/account/addresses/${addressId}/edit`,
        isEdit: true,
        address: { id: addressId, ...payload },
        errors,
      });
    }

    const { error } = await supabase
      .from('addresses')
      .update(payload)
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating address:', error);
      req.session.flash = { error: 'Could not update address.' };
      return res.redirect('/account/addresses');
    }

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

    req.session.flash = { success: 'Address updated.' };
    res.redirect('/account/addresses');
  } catch (err) {
    next(err);
  }
});




// =================================================
// ================ Delete address =================
// =================================================
router.post('/addresses/:id/delete', async (req, res, next) => {
  try {
    const addressId = req.params.id;
    let user = await userDatabase.getUser(req);
    if (user.error) return next(user.errorDetail || new Error(user.error));

    const { supabase, id: userId } = user;

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting address:', error);
      // Likely FK violation if used in orders
      req.session.flash = {
        error: 'This address cannot be deleted because it is attached to an order.',
      };
      return res.redirect('/account/addresses');
    }

    req.session.flash = { success: 'Address deleted.' };
    res.redirect('/account/addresses');
  } catch (err) {
    next(err);
  }
});



// ==================================================
// ========== Set default shipping  =================
// ==================================================
router.post('/addresses/:id/default-shipping', async (req, res, next) => {
  try {
    const addressId = req.params.id;
    let user = await userDatabase.getUser(req);
    if (user.error) return next(user.errorDetail || new Error(user.error));

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

    req.session.flash = { success: 'Default shipping address updated.' };
    res.redirect('/account/addresses');
  } catch (err) {
    next(err);
  }
});



// ==================================================
// =========== Set default billing ==================
// ==================================================
router.post('/addresses/:id/default-billing', async (req, res, next) => {
  try {
    const addressId = req.params.id;
    let user = await userDatabase.getUser(req);
    if (user.error) return next(user.errorDetail || new Error(user.error));

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

    req.session.flash = { success: 'Default billing address updated.' };
    res.redirect('/account/addresses');
  } catch (err) {
    next(err);
  }
});


module.exports = router;
