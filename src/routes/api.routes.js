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

router.get('/api/current-theme', async (req, res) => {
  const themeData = await require("../models/themeDatabase.js").getCurrentTheme();
  res.json(themeData);
});
router.get('/api/themes', async (req, res) => {
  const themes = await require("../models/themeDatabase.js").getAllThemes();
  res.json(themes);
});
router.get('/api/theme/:name', async (req, res) => {
  const { name } = req.params;
  let themeData = null;
  if (name === 'auto') themeData = await require("../models/themeDatabase.js").getCurrentTheme();
  else themeData = await require("../models/themeDatabase.js").getThemeByKey(name);

  if (themeData == null) return res.status(400).json({ error: "Unknown theme" });
  res.json({ ok: true, theme: themeData });
});



module.exports = router;