

const cache = require('../controllers/cache.js');
const debug = require('../controllers/debug');
const database = require('./db.js');
const mock = require('./mock/productDatabase.js');


module.exports = {
  ttl: 60_000,
  namespace: 'productDB',
  getProducts: async function () {
    if (debug.isMockDB()) return mock.getProducts();
    const key = `${this.namespace}:products`;

    return cache.wrap(key, this.ttl, async () => {
      const res = await database.query('SELECT * FROM products');
      console.log(res.rows);
      return res.rows;
    });
  },
  getFeatured: async function () {
    if (debug.isMockDB()) return mock.getFeatured();
    const key = `${this.namespace}:featured`;
    return cache.wrap(key, this.ttl, mock.getFeatured);
  },
  getCategories: async function () {
    if (debug.isMockDB()) return mock.getCategories();
    const key = `${this.namespace}:categories`;
    return cache.wrap(key, this.ttl, mock.getCategories);
  },
  getNewArrivals: async function (count) {
    if (debug.isMockDB()) return mock.getNewArrivals(count);
    const key = `${this.namespace}:newarrivals:${count}`;
    return cache.wrap(key, this.ttl, () => mock.getNewArrivals(count));
  },
};
