const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const db = require('../models/productDatabase.js');
const { bind } = require('express-page-registry');

// CSRF protection configured to use the session (not cookies)
// Routes that render forms should include `csrfProtection` so the
// token is available to templates and validated on submit.
const csrfProtection = csrf({ cookie: false });
const debug = require('../controllers/debug.js')('Routes.Shop');

// Short redirect for legacy `/shop` URL — currently redirects to
// the home page which may render featured/shop listings.
router.get('/shop', async (req, res) => {
  res.redirect('/');
});

// Backwards-compatible route: `/product/:slug` redirects to the
// canonical `/shop/:slug` detail path. Keeps older links functional.
router.get('/product/:slug', async (req, res) => {
  res.redirect(`/shop/${req.params.slug}`);
});

bind(router, {
  route: '/category/:slug',
  view: 'shop/list',
  meta: {},
  // Include CSRF so views can embed tokens for any forms/filters
  // and the `csrfLocals` middleware exposes the token to templates.
  middleware: [csrfProtection, require('../middleware/csrfLocals')],
  getData: async function (req) {
    const { slug } = req.params;
    // Pagination: `page` comes from query string and defaults to 1.
    // `pageSize` controls items per page.
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = 24;
    const category = await db.getCategory(slug);
    if (!category) {
      throw new Error('Category not found');
    }
    db.categoryBindProducts([category]);

    let products = category.products || [];
    // NOTE: `category.products` is expected to be the full list of
    // product ids for the category. We slice here to the current
    // page. If you want `total` to represent the full result count,
    // compute it from `category.products.length` BEFORE slicing.
    products = products.slice((page - 1) * pageSize, page * pageSize);
    const total = products.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));

    return {
      title: `${slug}`,
      mainTitle: category.name,
      subtitle: `${total} item${total === 1 ? '' : 's'} in "${category.name}"`,
      backUrl: '/',
      products,
      totalCount: total,
      pageCount,
      basePath: `/category/${encodeURIComponent(slug)}`,
      query: {}, // carry other filters if you add them
    };
  },
});

bind(router, {
  route: '/shop/:slug',
  view: 'shop/detail',
  meta: {},
  // Product detail view: include CSRF token for any client-side
  // forms (e.g., add to cart) and expose token to templates.
  middleware: [csrfProtection, require('../middleware/csrfLocals')],
  getData: async function (req) {
    const { slug } = req.params;

    const product = await db.getBySlug(slug);
    if (!product) throw new Error('Product not found');
    await db.bindImages([product]);
    await db.bindCategories([product]);

    // Ensure we have at least one

    // Related (unchanged)
    let related = [];
    try {
      const category = product.categories[0];
      if (category && Array.isArray(category.products)) {
        const others = category.products
          .filter((id) => id !== product.id)
          .slice(0, 8);
        related = (
          await Promise.all(others.map((id) => db.getByID(id)))
        ).filter(Boolean);
      }
    } catch (err) {
      // Don't fail the whole page if related lookup errors — log
      // for debugging and continue returning the primary product.
      debug.error('Error fetching related products:', err);
    }

    return {
      title: product.name,
      mainTitle: product.name,
      backUrl: '/',
      product,
      images: product.images || [],
      primaryImageIndex: 0, // compute based on is_primary if you have it
      related,
    };
  },
});

module.exports = router;
