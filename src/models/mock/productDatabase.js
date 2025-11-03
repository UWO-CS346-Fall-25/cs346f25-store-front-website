

const cache = require('../../controllers/cache.js');


const database = {
  ttl: 60_000,
  namespace: 'productDB',
  getFeatured: async function () {
    const key = `${this.namespace}:featured`;
    return cache.wrap(key, this.ttl, () => require('./mock-data').featured);
  },
  getCategories: async function () {
    const key = `${this.namespace}:categories`;
    return cache.wrap(key, this.ttl, () => require('./mock-data').categories);
  },
  getNewArrivals: async function (count) {
    const key = `${this.namespace}:newarrivals:${count}`;
    return cache.wrap(key, this.ttl, () => require('./mock-data').new_arrivals);
  },
};

module.exports = database;

