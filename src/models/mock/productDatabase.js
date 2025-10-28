

const cache = require('../../controllers/cache.js');

const _PROD_COUNT = 70;
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
    imageUrl: `https://ihnfcvhiejquvpktwiai.supabase.co/storage/v1/object/public/test_items/${i + 1}.png`,
    alt: `Product ${i + 1}`,
    slug: `product-${i + 1}`,
    url: `/products/product-${i + 1}`,
    description: `This is a description for Product ${i + 1}.`,
  }));
};
async function getFeatured() {
  const temp = Array.from({ length: _PROD_COUNT }, (_, i) => i + 1);
  shuffle(temp);
  return temp.slice(0, 8);
}
async function getCategories() {
  const temp = Array.from({ length: _PROD_COUNT }, (_, i) => i + 1);
  shuffle(temp);
  const categoryNames = ['Summer Exclusive', 'Winter Collection', 'Autumn Arrivals', 'Book Covers', 'Art Prints'];

  const perCat = 7;
  const numCats = Math.ceil(_PROD_COUNT / perCat);
  return Array.from({ length: numCats }, (_, i) => ({
    name: categoryNames[i] || `Category ${i + 1}`,
    products: temp.slice(i * perCat, i * perCat + perCat),
    count: perCat,
    displayIndex: (i >= 2 ? 0 : i + 1),
    slug: `category-${i + 1}`,
    imageUrl: '/images/RavensTreasures_Logo.jpg',
  }));
}
async function getNewArrivals(count) {
  const products = await getProducts();
  shuffle(products);
  return products.slice(0, count);
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
  getNewArrivals: async function (count) {
    const key = `${this.namespace}:newarrivals:${count}`;
    return cache.wrap(key, this.ttl, () => getNewArrivals(count));
  },
};

module.exports = database;

