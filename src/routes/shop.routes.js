const express = require("express");
const router = express.Router();
const csrf = require('csurf');
const shopController = require('../controllers/productController.js');
const { bind } = require('express-page-registry');

const csrfProtection = csrf({ cookie: false });

bind(router, {
  route: '/shop/category/:slug',
  view: 'shop/list',
  meta: { title: '' },
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
      csrfToken: req.csrfToken(),
      subtitle: `${total} item${total === 1 ? '' : 's'} in "${category.name}"`,
      backUrl: '/shop',
      products,
      totalCount: total,
      pageCount,
      basePath: `/shop/category/${encodeURIComponent(slug)}`,
      query: {} // carry other filters if you add them
    };
  }
});


module.exports = router;
