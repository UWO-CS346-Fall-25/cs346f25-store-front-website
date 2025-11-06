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

    const product = await shopController.getProductBySlug(slug);
    if (!product) throw new Error('Product not found');

    // Build images[]: prefer explicit images from controller/model
    let images = [];
    try {
      const rows = await shopController.getImagesForProduct(product.id); // expect [{img_url, alt, is_primary}, ...]
      images = (rows || []).map(r => ({ url: r.img_url || r.url, alt: r.alt || product.name || '' }));
    } catch (_) { }

    // Fallbacks: product.images or single product.image/img_url
    if (!images.length && Array.isArray(product.images) && product.images.length) {
      images = product.images.map(x => ({ url: x.img_url || x.url, alt: x.alt || product.name || '' }));
    }
    if (!images.length && (product?.image?.img_url || product?.img_url || product?.image_url)) {
      images = [{ url: (product.image?.img_url || product.img_url || product.image_url), alt: product.name || '' }];
    }

    // Ensure we have at least one
    if (!images.length) images = [];

    // Related (unchanged)
    let related = [];
    try {
      const category = await shopController.getProductCategory(product.id);
      if (category && Array.isArray(category.products)) {
        const others = category.products.filter(id => id !== product.id).slice(0, 8);
        related = (await Promise.all(others.map(id => shopController.getProductById(id)))).filter(Boolean);
      }
    } catch (_) { }

    return {
      title: product.name,
      mainTitle: product.name,
      backUrl: '/',
      product,
      images,
      primaryImageIndex: 0,   // compute based on is_primary if you have it
      related
    };
  }
});


module.exports = router;
