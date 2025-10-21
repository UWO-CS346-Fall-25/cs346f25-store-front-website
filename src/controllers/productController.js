

const db = require('../models/productDatabase.js');


const productManager = {
  getProducts: async function () {
    return await db.getProducts();
  },
  getProductById: async function (id) {
    const products = await db.getProducts();
    return products.find(p => p.id === id) || null;
  },
  getProductCategory: async function (productId) {
    const categories = await db.getCategories();
    return categories.find(cat => cat.products.includes(productId)) || null;
  },
  getProductBySlug: async function (slug) {
    const products = await db.getProducts();
    return products.find(p => p.slug === slug) || null;
  },

  getFeatured: async function () {
    const products = await db.getProducts();
    const featuredIds = await db.getFeatured();
    return products.filter(p => featuredIds.includes(p.id));
  },
  getCategories: async function () {
    const products = await db.getProducts();
    const categories = await db.getCategories();
    return categories.map(cat => ({
      ...cat,
      products: products.filter(p => cat.products.includes(p.id))
    }));
  },
};

module.exports = productManager;






