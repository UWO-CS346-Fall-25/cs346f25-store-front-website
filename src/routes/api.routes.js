const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const productManager = require('../controllers/productController.js');

const csrfProtection = csrf({ cookie: false });

const database = require('../models/productDatabase.js');

router.get('/api/featured', async (req, res) => {
  const featuredProducts = await productManager.getFeatured();
  res.json(featuredProducts);
});
router.get('/api/categories', async (req, res) => {
  const categories = await productManager.getCategories();
  res.json(categories);
});
router.get('/api/new-arrivals', async (req, res) => {
  let count = parseInt(req.query.count) || 8;
  if (count < 1) count = 1;
  if (count > 50) count = 50;
  const newArrivals = await productManager.getNewArrivals(count);
  res.json(newArrivals);
});

module.exports = router;