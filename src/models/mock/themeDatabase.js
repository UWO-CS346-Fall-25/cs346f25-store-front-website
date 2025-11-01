

const cache = require('../../controllers/cache.js');


const database = {
  ttl: 60_000 * 10,
  namespace: 'themeDB',
  getCurrentTheme: async function () {
    const key = `${this.namespace}:currentTheme`;
    return cache.wrap(key, this.ttl, () => require('./mock-data').currentTheme);
  },
  getThemeByKey: async function (key) {
    const cacheKey = `${this.namespace}:theme:${key}`;
    return cache.wrap(key, this.ttl, () => require('./mock-data').currentTheme);
  },
  getAllThemes: async function () {
    const key = `${this.namespace}:allThemes`;
    return cache.wrap(key, this.ttl, () => require('./mock-data').allThemes);
  },
  getThemeByID(id) {
    const key = `${this.namespace}:themeByID:${id}`;
    return cache.wrap(key, this.ttl, () => require('./mock-data').currentTheme);
  }
};

module.exports = database;

