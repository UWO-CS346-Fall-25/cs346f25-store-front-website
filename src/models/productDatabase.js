

const cache = require('../controllers/cache.js');

const _PROD_COUNT = 30;
// TODO: Switch to database queries

// Fisher–Yates shuffle
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
async function getProducts() {
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
async function getFeatured() {
  console.log('Fetching featured products...');
  const temp = Array.from({ length: _PROD_COUNT }, (_, i) => i + 1);
  shuffle(temp);
  return temp.slice(0, 8);
}
async function getCategories() {
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


const database = {
  ttl: 60_000,
  namespace: 'productDB',
  getProducts: async function () {
    const key = `${this.namespace}:products`;
    return cache.wrap(key, this.ttl, getProducts);
  },
  getFeatured: async function () {
    const key = `${this.namespace}:featured`;
    return cache.wrap(key, this.ttl, getFeatured);
  },
  getCategories: async function () {
    const key = `${this.namespace}:categories`;
    return cache.wrap(key, this.ttl, getCategories);
  },
};

module.exports = database;

