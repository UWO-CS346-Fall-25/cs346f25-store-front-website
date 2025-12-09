function classifyStock(stock, options = {}) {
  const {
    lowThreshold = 5,
    overstockThreshold = 100,
  } = options;

  if (stock <= lowThreshold) return "low";
  if (stock >= overstockThreshold) return "over";
  return "ok";
}

function classifyStockData(items, options = {}) {
  return items
    .map((p) => ({
      ...p,
      stockStatus: classifyStock(p.stock, options),
    }));
}

module.exports = {
  classifyStock,
  classifyStockData,
};