

const cache = require('../controllers/cache.js');
const debug = require('../controllers/debug');
const database = require('./db.js');
const mock = require('./mock/productDatabase.js');


function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
async function getCategories(products) {
  const temp = Array.from({ length: products.length }, (_, i) => products[i].id);
  shuffle(temp);
  const categoryNames = ['Summer Exclusive', 'Winter Collection', 'Autumn Arrivals', 'Book Covers', 'Art Prints'];

  const perCat = 5;
  const numCats = Math.ceil(products.length / perCat);
  return Array.from({ length: numCats }, (_, i) => ({
    name: categoryNames[i] || `Category ${i + 1}`,
    products: temp.slice(i * perCat, i * perCat + perCat),
    count: perCat,
    displayIndex: (i >= 2 ? 0 : i + 1),
    slug: `category-${i + 1}`,
    imageUrl: '/images/RavensTreasures_Logo.jpg',
  }));
}

module.exports = {
  ttl: 60_000,
  namespace: 'productDB',
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
  getFeatured: async function () {
    if (debug.isMockDB()) return mock.getFeatured();
    const key = `${this.namespace}:featured`;
    return cache.wrap(key, this.ttl, async () => {
      const res = await database.query('SELECT * FROM public.v_featured_products order by position');
      for (let r of res.rows) {
        r.img_url = r.image_path == null ? r.image_external_url : r.image_path;
      }
      console.log(res.rows);
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
