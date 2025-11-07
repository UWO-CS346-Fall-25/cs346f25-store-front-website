const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const db = require('../models/productDatabase.js'); // still fine to keep, even if not used here
const { authClient } = require('../models/supabase.js');
const { uploadProductImages } = require('../middleware/uploads');
const { uncacheProduct } = require('../models/productDatabase.js');

const csrfProtection = csrf({ cookie: false });

function dollarsToCents(value) {
  if (value == null || value === '') return 0;
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

// POST /admin/products/create
router.post(
  '/products/create',
  uploadProductImages,   // 1) parse files and multipart form
  csrfProtection,        // 2) check CSRF token from parsed body
  async (req, res, next) => {
    const supabase = authClient(req);

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
        image_url,       // optional external URL
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

      // 1) Insert product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert(insertRow)
        .select('*')
        .single();

      if (productError) {
        console.error('Error inserting product:', productError);
        if (req.flash) {
          const isRls =
            productError.code === '42501' ||
            (typeof productError.message === 'string' &&
              /row-level security/i.test(productError.message));

          const message = isRls
            ? 'You do not have permission to create products. Make sure you are logged in as an admin.'
            : 'Something went wrong creating the product. Please try again.';

          req.flash('error', message);
        }
        return res.redirect('/admin/products/new');
      }

      const productId = product.id;

      // 2) Handle uploaded images -> Supabase Storage + product_images
      const files = req.files || [];
      const imageRows = [];

      // name your bucket appropriately
      const bucketName = 'product-images';

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Create a storage path like products/{productId}/timestamp-index.ext
        const ext = (file.originalname && file.originalname.includes('.'))
          ? file.originalname.substring(file.originalname.lastIndexOf('.'))
          : '';
        const filename = `${Date.now()}-${i}${ext}`;
        const storagePath = `products/${productId}/${filename}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (uploadError) {
          console.error('Error uploading image to Supabase:', uploadError);
          // You can choose to continue or abort here; for now we continue but log it
          continue;
        }

        imageRows.push({
          product_id: productId,
          path: filename,
          alt: name,
          position: i,
          is_primary: i === 0,
        });
      }

      // 3) If no uploads but there is an image_url, store it as an external image
      if (imageRows.length === 0 && image_url && image_url.trim().length) {
        imageRows.push({
          product_id: productId,
          path: null,
          external_url: image_url.trim(),
          // alt: name,
          // is_primary: true,
        });
      }

      if (imageRows.length > 0) {
        const { error: imgError } = await supabase
          .from('product_images')
          .insert(imageRows);

        if (imgError) {
          console.error('Error inserting product_images:', imgError);
          // product already exists; you might optionally flash a warning
          req.flash?.(
            'error',
            'Product was created, but there was a problem saving images.'
          );
          return res.redirect('/admin/products');
        }
      }
      uncacheProduct(productId);
      req.flash?.('success', 'Product created successfully.');
      return res.redirect(`/shop/${product.slug}`);

    } catch (err) {
      console.error('Unexpected error creating product:', err);
      return next(err);
    }
  }
);

module.exports = router;
