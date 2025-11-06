

const cache = require('../controllers/cache.js');
const database = require('./db.js');

const NAMESPACE = 'productDB';
const TTL = 60_000; // TODO: adjust cache TTL as needed (should be higher / can clear cache as needed)


async function bindImages(products) {
  await Promise.all(products.map(async (p) => {
    const key = `${NAMESPACE}:product:${p.id}:images`;
    p.images = await cache.wrap(key, TTL, async () => {
      const res = await database.query('SELECT path, external_url, alt FROM public.product_images WHERE product_id = $1 ORDER BY is_primary DESC, id ASC', [p.id]);
      for (let r of res.rows) {
        r.img_url = r.path == null ? r.external_url : r.path;
      }
      return res.rows;
    });
  }));
}


// takes an array of products and binds 1 primary images to them
async function bindPrimaryImage(products) {
  await Promise.all(products.map(async (p) => {
    const key = `${NAMESPACE}:product:${p.id}:primaryImage`;
    p.image = await cache.wrap(key, TTL, async () => {
      const prodImg = await database.query('SELECT path, external_url, alt FROM public.product_images WHERE product_id = $1 AND is_primary = true LIMIT 1', [p.id]);
      if (prodImg.rows.length === 0) return null;
      return {
        img_url: prodImg.rows[0].path == null ? prodImg.rows[0].external_url : prodImg.rows[0].path,
        alt: prodImg.rows[0].alt,
      };
    });
  }));
}

async function bindCategories(products) {
  await Promise.all(products.map(async (p) => {
    const key = `${NAMESPACE}:product:${p.id}:categories`;
    p.categories = await cache.wrap(key, TTL, async () => {
      const res = await database.query('SELECT c.id, c.name, c.slug FROM public.categories c JOIN public.product_categories pc ON c.id = pc.category_id WHERE pc.product_id = $1', [p.id]);
      return res.rows;
    });
  }));
}

async function categoryBindProducts(categories) {
  await Promise.all(categories.map(async (c) => {
    const key = `${NAMESPACE}:category:${c.id}:products`;
    c.products = await cache.wrap(key, TTL, async () => {
      const res = await database.query('SELECT p.* FROM public.products p JOIN public.product_categories pc ON p.id = pc.product_id WHERE pc.category_id = $1', [c.id]);
      return res.rows;
    });
  }));
}



module.exports = {
  bindImages,
  bindPrimaryImage,
  bindCategories,
  categoryBindProducts,

  getAll: async function () {
    const key = `${NAMESPACE}:allProducts`;
    return cache.wrap(key, TTL, async () => {
      const res = await database.query('SELECT * FROM public.products');
      return res.rows;
    });
  },
  getByID: async function (id) {
    const key = `${NAMESPACE}:product:${id}`;
    return cache.wrap(key, TTL, async () => {
      const res = await database.query('SELECT * FROM public.products WHERE id = $1', [id]);
      return res.rows[0] || null;
    });
  },
  getBySlug: async function (slug) {
    const key = `${NAMESPACE}:product:${slug}:slug`;
    return cache.wrap(key, TTL, async () => {
      const res = await database.query('SELECT * FROM public.products WHERE slug = $1', [slug]);
      return res.rows[0] || null;
    });
  },
  getFeatured: async function () {
    const key = `${NAMESPACE}:featured`;
    return cache.wrap(key, TTL, async () => {
      const res = await database.query('SELECT * FROM public.v_featured_products order by position');
      for (let r of res.rows) {
        r.img_url = r.image_path == null ? r.image_external_url : r.image_path;
      }
      return res.rows;
    });
  },
  getCategories: async function () {
    const key = `${NAMESPACE}:categories`;
    return cache.wrap(key, TTL, async () => {
      const res = await database.query('SELECT * FROM public.categories ORDER BY position');
      return res.rows;
    });
  },
  getActiveCategories: async function () {
    const key = `${NAMESPACE}:activeCategories`;
    return cache.wrap(key, TTL, async () => {
      const res = await database.query('SELECT * FROM public.categories WHERE is_active = true ORDER BY position');
      return res.rows;
    });
  },
  getCategory: async function (idOrSlug) {
    const key = `${NAMESPACE}:category:${idOrSlug}`;
    return cache.wrap(key, TTL, async () => {
      let res;
      if (isNaN(Number(idOrSlug))) {
        res = await database.query('SELECT * FROM public.categories WHERE slug = $1', [idOrSlug]);
      } else {
        res = await database.query('SELECT * FROM public.categories WHERE id = $1', [idOrSlug]);
      }
      return res.rows[0] || null;
    });
  },
  getNewArrivals: async function (count) {
    const key = `${NAMESPACE}:newarrivals:${count}`;

    return cache.wrap(key, TTL, async () => {
      const res = await database.query('SELECT * FROM public.products ORDER BY created_at DESC LIMIT $1', [count]);
      return res.rows;
    });
  },
  uncacheProduct: async function (id, slug = null) {
    if (!slug) {
      const res = await database.query('SELECT slug FROM public.products WHERE id = $1', [id]);
      slug = res.rows[0]?.slug;
    }
    const keys = [
      `${NAMESPACE}:product:${id}`,
      slug ? `${NAMESPACE}:product:${slug}` : null,
      `${NAMESPACE}:newarrivals`,
      `${NAMESPACE}:allProducts`,
    ].filter(Boolean);
    keys.forEach(k => cache.clearNamespace(k));
  },
  uncacheCategory: async function (id, slug = null) {
    if (!slug) {
      const res = await database.query('SELECT slug FROM public.categories WHERE id = $1', [id]);
      slug = res.rows[0]?.slug;
    }
    const keys = [
      `${NAMESPACE}:category:${id}`,
      slug ? `${NAMESPACE}:category:${slug}` : null,
    ].filter(Boolean);
    keys.forEach(k => cache.clearNamespace(k));
  }
};
