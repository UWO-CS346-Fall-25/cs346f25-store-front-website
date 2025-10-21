
// TODO: Switch to database queries

const cache = require('../controllers/cache.js');
const _PROD_COUNT = 24;

// Fisher–Yates shuffle
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}


async function randomItemGenerator() {
  console.log('Generating random items...');
  return Array.from({ length: _PROD_COUNT }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    price: (Math.random() * 100).toFixed(2),
    imageUrl: `/images/test-images/${i + 1}.png`,
    alt: `Product ${i + 1}`,
    slug: `product-${i + 1}`,
    url: `/products/product-${i + 1}`
  }));
};

// gets an array of product ids (not objects)
async function getFeaturedProducts_IDS() {
  console.log('Fetching featured products...');
  const temp = Array.from({ length: _PROD_COUNT }, (_, i) => i + 1);
  shuffle(temp);
  return temp.slice(0, 8);
}

// gets categories name, productIDS array, and count
async function getAllCategories_IDS() {
  console.log('Fetching all categories...');
  const temp = Array.from({ length: _PROD_COUNT }, (_, i) => i + 1);
  shuffle(temp);

  const perCat = 4;
  const numCats = Math.ceil(_PROD_COUNT / perCat); // <-- was % 4 (0)
  return Array.from({ length: numCats }, (_, i) => ({
    name: `Category ${i + 1}`,
    products: temp.slice(i * perCat, i * perCat + perCat),
    count: perCat,
    imageUrl: '/images/RavensTreasures_Logo.jpg',
  }));
}




const productManager = {
  dirty: false,
  ttl: 60_000,

  // Use function() so `this` works; or use productManager.ttl directly
  getAllProducts: async function () {
    const key = 'product:all';
    return cache.wrap(key, this.ttl, () => randomItemGenerator());
    // or: return cache.wrap(key, productManager.ttl, randomItemGenerator);
  },

  getFeaturedProducts: async function () {
    const key = 'product:featured';
    return cache.wrap(key, this.ttl, async () => {
      const [allProducts, featuredIDs] = await Promise.all([
        productManager.getAllProducts(),
        getFeaturedProducts_IDS(),
      ]);
      return allProducts.filter(p => featuredIDs.includes(p.id));
    });
  },

  getAllCategories: async function () {
    const key = 'product:categories';
    return cache.wrap(key, this.ttl, async () => {
      const [allProducts, categoriesData] = await Promise.all([
        productManager.getAllProducts(),
        getAllCategories_IDS(),
      ]);
      return categoriesData.map(cat => ({
        ...cat,
        products: allProducts.filter(p => cat.products.includes(p.id)),
      }));
    });
  },
};

module.exports = productManager;






