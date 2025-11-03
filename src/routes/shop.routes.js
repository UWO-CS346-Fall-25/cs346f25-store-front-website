const express = require("express");
const router = express.Router();
const csrf = require('csurf');
const shopController = require('../controllers/productController.js');
const { bind } = require('express-page-registry');

const csrfProtection = csrf({ cookie: false });

bind(router, {
  route: '/category/:slug',
  view: 'shop/list',
  meta: {},
  middleware: [csrfProtection],
  getData: async function (req) {

    const { slug } = req.params;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = 24;
    const category = await shopController.getCategoryBySlug(slug);
    if (!category) {
      throw new Error('Category not found');
    }

    let products = (await shopController.getItemsInCategory(category.id));
    products = products.slice((page - 1) * pageSize, page * pageSize);
    const total = products.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));

    return {
      title: `${slug}`,
      mainTitle: category.name,
      csrfToken: req.csrfToken(),
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
  middleware: [csrfProtection],
  getData: async function (req) {
    const { slug } = req.params;

    // 1) Main product
    const product = await shopController.getProductBySlug(slug);
    if (!product) {
      // Let your error template handle this
      throw new Error('Product not found');
    }

    // // 2) Price string (server-side so EJS stays simple)
    const priceCents = product.price_cents ?? product.priceCents ?? null;
    const priceStr = (typeof priceCents === 'number')
      ? `$${(priceCents / 100).toFixed(2)}`
      : null;

    // // 3) Related products (same category, excluding this product)
    let related = [];
    try {
      const category = await shopController.getProductCategory(product.id);
      if (category && Array.isArray(category.products)) {
        // category.products appears to be an array of product IDs per your controller
        const others = category.products.filter(id => id !== product.id).slice(0, 8);
        // hydrate each related product by id
        related = await Promise.all(
          others.map(id => shopController.getProductById(id))
        );
        related = related.filter(Boolean);
      }
    } catch (_) {
      // related is optional—ignore issues quietly
    }

    return {
      title: product.name,
      mainTitle: product.name,
      csrfToken: req.csrfToken(),
      backUrl: '/',
      product,
      priceStr,
      related
    };
  }
});

module.exports = router;
