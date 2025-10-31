

const db = require('../models/productDatabase.js');
const { get } = require('./cache.js');


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
    return await db.getFeatured();
  },
  getCategories: async function () {
    return await db.getCategories();
  },
  getNewArrivals: async function (count) {
    return await db.getNewArrivals(count);
  }

};

module.exports = productManager;






