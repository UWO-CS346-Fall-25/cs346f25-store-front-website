
const database = require('../../models/supabase.js');
const cache = require('../../controllers/cache.js');
const { bindPrimaryImage } = require('../productDatabase.js');

async function getProductStockLevels() {
  const ttl = 60_000 * 30; // cache for 30 minutes
  const key = 'analytics:productStockLevels';
  let data = await cache.wrap(key, ttl, async () => {
    const supabase = database.masterClient();
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, sku, stock_quantity, low_stock_threshold')
      .eq('track_inventory', true)
      .order('stock_quantity', { ascending: true });
    if (error) {
      console.error('Error fetching product stock levels:', error);
      return [];
    }
    return products;
  });
  return await bindPrimaryImage(data);
}


module.exports = {
  getProductStockLevels,
};
