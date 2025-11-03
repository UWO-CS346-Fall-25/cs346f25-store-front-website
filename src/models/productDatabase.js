

const cache = require('../controllers/cache.js');
const debug = require('../controllers/debug');
const database = require('./db.js');
const mock = require('./mock/productDatabase.js');

module.exports = {
  ttl: 60_000,
  namespace: 'productDB',
  getAllProducts: async function () {
    const key = `${this.namespace}:allProducts`;
    return cache.wrap(key, this.ttl, async () => {
      const res = await database.query('SELECT * FROM public.products');
      return res.rows;
    });
  },
  getProduct: async function (id) {
    const key = `${this.namespace}:product:${id}`;
    return cache.wrap(key, this.ttl, async () => {
      const res = await database.query('SELECT * FROM public.products WHERE id = $1', [id]);
      return res.rows[0] || null;
    });
  },
  getProductBySlug: async function (slug) {
    const key = `${this.namespace}:productBySlug:${slug}`;
    return cache.wrap(key, this.ttl, async () => {
      const res = await database.query('SELECT * FROM public.products WHERE slug = $1', [slug]);
      return res.rows[0] || null;
    });
  },
  getProductWithImage: async function (id) {
    if (debug.isMockDB()) return mock.getProductWithImage();
    const key = `${this.namespace}:product:${id}`;
    return cache.wrap(key, this.ttl, async () => {
      const res = await database.query('SELECT * FROM public.products WHERE id = $1', [id]);
      const prodImg = await database.query('SELECT path, external_url, alt FROM public.product_images WHERE product_id = $1 AND is_primary = true LIMIT 1', [id]);
      prodImg.rows[0].img_url = prodImg.rows[0].path == null ? prodImg.rows[0].external_url : prodImg.rows[0].path;
      res.rows[0].image = prodImg.rows[0];
      return res.rows[0];
    });
  },
  getImagesForProduct: async function (productId) {
    const key = `${this.namespace}:productImages:${productId}`;
    return cache.wrap(key, this.ttl, async () => {
      const res = await database.query('SELECT path, external_url, alt FROM public.product_images WHERE product_id = $1 ORDER BY is_primary DESC, id ASC', [productId]);
      for (let r of res.rows) {
        r.img_url = r.path == null ? r.external_url : r.path;
      }
      return res.rows;
    });
  },
  getFeatured: async function () {
    if (debug.isMockDB()) return mock.getFeatured();
    const key = `${this.namespace}:featured`;
    return cache.wrap(key, this.ttl, async () => {
      const res = await database.query('SELECT * FROM public.v_featured_products order by position');
      for (let r of res.rows) {
        r.img_url = r.image_path == null ? r.image_external_url : r.image_path;
      }
      return res.rows;
    });
  },
  getCategories: async function () {
    if (debug.isMockDB()) return mock.getCategories();
    const key = `${this.namespace}:categories`;
    return cache.wrap(key, this.ttl, async () => {
      const res = await database.query('SELECT * FROM categories where is_active = true order by position');
      for (let r of res.rows) {
        const prods = await database.query('SELECT product_id FROM product_categories WHERE category_id = $1', [r.id]);
        let prods_delta = [];
        for (let p of prods.rows) {
          prods_delta.push(await this.getProductWithImage(p.product_id));
        }
        r.products = prods_delta;
      }
      return res.rows;
    });
  },
  getNewArrivals: async function (count) {
    if (debug.isMockDB()) return mock.getNewArrivals(count);
    const key = `${this.namespace}:newarrivals:${count}`;

    return cache.wrap(key, this.ttl, async () => {
      const res = await database.query('SELECT * FROM products ORDER BY created_at DESC LIMIT $1', [count]);
      for (let r of res.rows) {
        const prodImg = await database.query('SELECT path, external_url, alt FROM public.product_images WHERE product_id = $1 AND is_primary = true LIMIT 1', [r.id]);
        prodImg.rows[0].img_url = prodImg.rows[0].path == null ? prodImg.rows[0].external_url : prodImg.rows[0].path;
        r.image = prodImg.rows[0];
      }
      return res.rows;
    });
  },
};
