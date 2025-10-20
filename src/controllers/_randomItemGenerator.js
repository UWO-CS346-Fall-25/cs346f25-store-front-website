

module.exports = function randomItemGenerator(count) {
  return Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    price: (Math.random() * 100).toFixed(2),
    imageUrl: `/images/test-images/${i + 1}.png`,
    alt: `Product ${i + 1}`,
    slug: `product-${i + 1}`,
    url: `/products/product-${i + 1}`
  }));
};