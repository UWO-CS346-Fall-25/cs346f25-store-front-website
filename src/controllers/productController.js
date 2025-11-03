

const db = require('../models/productDatabase.js');


const productManager = {
  getProductById: async function (id) {
    return await db.getProduct(id);
  },
  getProductBySlug: async function (slug) {
    return await db.getProductBySlug(slug);
  },


  getProductCategory: async function (productId) {
    const categories = await db.getCategories();
    return categories.find(cat => cat.products.includes(productId)) || null;
  },

  getCategoryBySlug: async function (slug) {
    const categories = await db.getCategories();
    return categories.find(c => c.slug === slug) || null;
  },
  getItemsInCategory: async function (categoryId) {
    const categories = await db.getCategories();
    const category = categories.find(c => c.id === categoryId);
    if (!category) return [];
    return category.products;
  },

  getFeatured: async function () {
    return await db.getFeatured();
  },
  getCategories: async function () {
    return await db.getCategories();
  },
  getNewArrivals: async function (count) {
    return await db.getNewArrivals(count);
  },
  getImagesForProduct: async function (productId) {
    return await db.getImagesForProduct(productId);
  }

};

module.exports = productManager;






