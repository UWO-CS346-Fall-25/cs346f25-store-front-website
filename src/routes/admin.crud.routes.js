const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const db = require('../models/productDatabase.js');
const supabaseClient = require('../models/supabase.js');

const csrfProtection = csrf({ cookie: false });

function dollarsToCents(value) {
  if (value == null || value === '') return 0;
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

function getFlash(req) {
  return req.flash ? { error: req.flash('error')[0] } : {};
}



router.post('/products/create', csrfProtection, async (req, res, next) => {
  const supabase = supabaseClient(req);
  try {
    const {
      name,
      slug,
      description,
      big_description,
      price,
      currency,
      status,
      is_active,
      seo_title,
      seo_description,
      sku,
      image_url,
    } = req.body;

    // basic validation
    if (!name || !price) {
      req.flash?.('error', 'Name and price are required.');
      return res.redirect('/admin/products/new');
    }

    const price_cents = dollarsToCents(price);
    const productStatus = status || 'draft';
    const productCurrency = currency || 'USD';

    const active =
      is_active === 'true' ||
      is_active === 'on' ||
      is_active === '1';

    // Build row for public.products
    const insertRow = {
      name,
      // trigger auto-generate if empty or null
      slug: slug && slug.trim().length ? slug.trim() : null,
      description: description || null,
      big_description: big_description || null,
      price_cents,
      currency: productCurrency,
      status: productStatus,
      is_active: active,
      seo_title: seo_title || null,
      seo_description: seo_description || null,
      sku: sku || null,
    };

    const { data, error } = await supabase
      .from('products')
      .insert(insertRow)
      .select('*')
      .single();

    if (error) {
      console.error('Error inserting product:', error);
      if (req.flash) {
        const isRls =
          error.code === '42501' ||
          (typeof error.message === 'string' &&
            /row-level security/i.test(error.message));

        const message = isRls
          ? 'You do not have permission to create products. Make sure you are logged in as an admin.'
          : 'Something went wrong creating the product. Please try again.';

        req.flash('error', message);
      }
      return res.redirect('/admin/products/new');
    }

    req.flash?.('success', 'Product created successfully.');
    return res.redirect(`/admin/products`);

  } catch (err) {
    console.error('Unexpected error creating product:', err);
    return next(err);
  }
});




module.exports = router;