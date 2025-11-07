

const cache = require('../controllers/cache.js');
const debug = require('../controllers/debug');
const database = require('./db.js');


module.exports = {
  ttl: 60_000 * 10,
  namespace: 'themeDB',
  getCurrentTheme: async function () {
    const key = `${this.namespace}:currentTheme`;
    return cache.wrap(key, this.ttl, async () => {
      const res = await database.query('SELECT * FROM public.v_site_theme_current');
      return res.rows[0] || null;
    });
  },
  getThemeByKey: async function (key) {
    const cacheKey = `${this.namespace}:theme:${key}`;
    return cache.wrap(cacheKey, this.ttl, async () => {
      const res = await database.query('SELECT * FROM public.site_themes WHERE key = $1', [key]);
      return res.rows[0] || null;
    });
  },
  getAllThemes: async function () {
    const key = `${this.namespace}:allThemes`;
    return cache.wrap(key, this.ttl, async () => {
      const res = await database.query('SELECT * FROM public.site_themes ORDER BY created_at DESC');
      return res.rows;
    });
  },
  getThemeByID(id) {
    const key = `${this.namespace}:themeByID:${id}`;
    return cache.wrap(key, this.ttl, async () => {
      const res = await database.query('SELECT * FROM public.site_themes WHERE id = $1', [id]);
      return res.rows[0] || null;
    });
  }
};


