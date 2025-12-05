const express = require("express");
const router = express.Router();
const csrf = require('csurf');
const db = require('../models/productDatabase.js');
const { bind } = require('express-page-registry');

const csrfProtection = csrf({ cookie: false });

router.get('/shop', async (req, res, next) => {
  res.redirect('/');
});

router.get('/product/:slug', async (req, res, next) => {
  res.redirect(`/shop/${req.params.slug}`);
});

bind(router, {
  route: '/category/:slug',
  view: 'shop/list',
  meta: {},
  middleware: [csrfProtection, require('../middleware/csrfLocals')],
  getData: async function (req) {

    const { slug } = req.params;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = 24;
    const category = await db.getCategory(slug);
    if (!category) {
      throw new Error('Category not found');
    }
    db.categoryBindProducts([category]);

    let products = category.products || [];
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
      query: {} // carry other filters if you add them
    };
  }
});

bind(router, {
  route: '/shop/:slug',
  view: 'shop/detail',
  meta: {},
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
        const others = category.products.filter(id => id !== product.id).slice(0, 8);
        related = (await Promise.all(others.map(id => db.getByID(id)))).filter(Boolean);
      }
    } catch (err) {
      console.error('Error fetching related products:', err);
    }

    return {
      title: product.name,
      mainTitle: product.name,
      backUrl: '/',
      product,
      images: product.images || [],
      primaryImageIndex: 0,   // compute based on is_primary if you have it
      related
    };
  }
});


module.exports = router;
