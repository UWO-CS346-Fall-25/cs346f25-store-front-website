
const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { bind } = require('express-page-registry');
const db = require('../../../models/productDatabase.js');
const { authRequired, adminRequired } = require('../../../middleware/accountRequired.js');

const csrfProtection = csrf({ cookie: false });

const visuals = require('../../../controllers/visuals.js');
const { classifyStock } = require('../../../models/analytics/stock.js');
const pageData = require('../../../models/admin-page-data.js');
const { getProductStockLevels } = require('../../../models/analytics/analytics-tracker.js');
const { get } = require('./cache.routes.js');
const cache = require('../../../controllers/cache.js');

const productStats = [
  { name: 'Cat Tarot Cup', sku: 'CUP-001', category: 'Cups', revenue: 1820.75, unitsSold: 73, stock: 6 },
  { name: 'Galaxy Shirt', sku: 'SHIRT-003', category: 'Shirts', revenue: 950.2, unitsSold: 31, stock: 2 },
  { name: 'Sticker Pack', sku: 'STICK-010', category: 'Stickers', revenue: 410, unitsSold: 82, stock: 120 },
];
function stockBadgeClass(stockStatus) {
  let badgeClass = 'badge badge--ok';
  if (stockStatus === 'low') badgeClass = 'badge badge--danger';
  if (stockStatus === 'over') badgeClass = 'badge badge--over';
  return badgeClass;
}
function applyStockBadge(productStats) {
  const rows = productStats
    .map((p) => {
      const stockStatus = classifyStock(p.stock_quantity, {
        lowThreshold: p.low_stock_threshold,
        overThreshold: p.low_stock_threshold * 3,
      }); // 'ok' | 'low' | 'over'
      const badgeClass = stockBadgeClass(stockStatus);
      // Format image as HTML thumbnail if available
      const imageHtml = p.image && p.image.url
        ? `<img src="${p.image.url}" alt="${p.image.alt || p.name}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px;">`
        : '<span style="color: var(--muted);">No image</span>';
      return {
        id: p.id,
        image: imageHtml,
        name: p.name,
        sku: p.sku,
        stock_quantity: p.stock_quantity,
        // category: p.category,
        // revenue: `$${p.revenue.toFixed(2)}`,
        // unitsSold: p.unitsSold.toLocaleString(),
        // value is HTML, but still just the INSIDE of the cell
        stock: `<span class="${badgeClass}" data-product-id="${p.id}" data-stock-quantity="${p.stock_quantity}">${p.stock_quantity}</span>`,
        stockStatus,
      };
    })
    .sort((a, b) => b.stock_quantity - a.stock_quantity);
  return rows;
}




// Admin stock viewer with pagination
bind(router, {
  route: '/stock',
  view: 'admin/admin_panel',
  meta: pageData.stock,
  middleware: [authRequired, adminRequired, csrfProtection, require('../../../middleware/csrfLocals.js')],
  getData: async function (req) {
    const PAGE_SIZE = 10;
    const currentPage = Math.max(1, parseInt(req.query.page, 10) || 1);

    // Fetch and prepare all rows
    let allRows = await getProductStockLevels();
    allRows = applyStockBadge(allRows);

    // Calculate pagination
    const totalProducts = allRows.length;
    const totalPages = Math.ceil(totalProducts / PAGE_SIZE);
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const endIdx = startIdx + PAGE_SIZE;
    const pageRows = allRows.slice(startIdx, endIdx);

    // Build table with paginated rows
    const productTable = visuals.table('Product Performance')
      .setSubtitle('Sorted by stock quantity. Highlighting low and overstock inventory.')
      .setModifierClass('data-table--products')
      .addColumn({ key: 'image', label: '', rawHtml: true, className: 'col--image' })
      .addColumn({ key: 'name', label: 'Product' })
      .addColumn({ key: 'sku', label: 'SKU' })
      // .addColumn({ key: 'category', label: 'Category' })
      // .addColumn({ key: 'revenue', label: 'Revenue', align: 'right' })
      // .addColumn({ key: 'unitsSold', label: 'Units Sold', align: 'right' })
      .addColumn({ key: 'stock', label: 'Stock', align: 'right', className: 'col--stock', rawHtml: true });

    pageRows.forEach((r) => productTable.addRow(r));
    productTable
      .setRowClassGetter((row) => {
        if (row.stockStatus === 'low' || row.stockStatus === 'over') {
          return 'row--danger';
        }
        return '';
      })
      .setCellClassGetter((col, row) => {
        if (col.key === 'stock') {
          return stockBadgeClass(row.stockStatus);
        }
        return '';
      });

    // Build pagination info
    const pagination = {
      currentPage,
      totalPages,
      totalProducts,
      pageSize: PAGE_SIZE,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      nextPage: currentPage + 1,
      prevPage: currentPage - 1,
    };

    return {
      productTable,
      pagination,
      flash: req.session?.flash || null,
    }
  }
});

// POST route to update stock quantity
router.post('/stock/:productId/update', authRequired, adminRequired, csrfProtection, async (req, res) => {
  const { productId } = req.params;
  const { stock_quantity } = req.body;

  try {
    const { masterClient } = require('../../../models/supabase.js');
    const supabase = masterClient();

    const quantity = parseInt(stock_quantity, 10);
    if (isNaN(quantity) || quantity < 0) {
      req.flash?.('error', 'Invalid stock quantity.');
      return res.redirect('/admin/stock');
    }

    const { error } = await supabase
      .from('products')
      .update({ stock_quantity: quantity, updated_at: new Date().toISOString() })
      .eq('id', productId);

    cache.clearNS('analytics:productStockLevels');

    if (error) {
      console.error('Error updating stock:', error);
      req.flash?.('error', 'Failed to update stock.');
    } else {
      req.flash?.('success', `Stock updated to ${quantity}.`);
    }
  } catch (err) {
    console.error('Unexpected error updating stock:', err);
    req.flash?.('error', 'An unexpected error occurred.');
  }

  res.redirect('/admin/stock' + (req.body.page ? `?page=${req.body.page}` : ''));
});


module.exports = router;