
const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { bind } = require('express-page-registry');
const { authRequired, adminRequired } = require('../../../middleware/accountRequired.js');
const csrfProtection = csrf({ cookie: false });
const pageData = require('../../../models/admin-page-data.js');

const visuals = require('../../../controllers/visuals.js');
const { classifyStock } = require('../../../models/analytics/stock.js');

const productStats = [
  { name: 'Cat Tarot Cup', sku: 'CUP-001', category: 'Cups', revenue: 1820.75, unitsSold: 73, stock: 6 },
  { name: 'Galaxy Shirt', sku: 'SHIRT-003', category: 'Shirts', revenue: 950.2, unitsSold: 31, stock: 2 },
  { name: 'Sticker Pack', sku: 'STICK-010', category: 'Stickers', revenue: 410, unitsSold: 82, stock: 120 },
];

const rows = productStats
  .map((p) => {
    const stockStatus = classifyStock(p.stock); // 'ok' | 'low' | 'over'
    let badgeClass = 'badge badge--ok';
    if (stockStatus === 'low') badgeClass = 'badge badge--danger';
    if (stockStatus === 'over') badgeClass = 'badge badge--over';

    return {
      name: p.name,
      sku: p.sku,
      category: p.category,
      revenue: `$${p.revenue.toFixed(2)}`,
      unitsSold: p.unitsSold.toLocaleString(),
      // value is HTML, but still just the INSIDE of the cell
      stock: `<span class="${badgeClass}">${p.stock}</span>`,
      stockStatus,
    };
  })
  .sort((a, b) => b.revenue - a.revenue);

bind(router, {
  route: '/test',
  view: 'admin/admin_panel',
  meta: pageData.test,
  middleware: [authRequired, adminRequired, csrfProtection, require('../../../middleware/csrfLocals.js')],
  getData: async function (req) {
    const revenueChart = visuals.lineChart('Revenue', 'Month', 'Revenue ($)');
    revenueChart.setXAxis(['January', 'February', 'March', 'April', 'May', 'June', 'July']);
    revenueChart.addSeries('Revenue', [12, 19, 3, 5, 2, 3, 9]);
    revenueChart.setID('revenueChart');
    const orderChart = visuals.lineChart('Orders', 'Month', 'Number of Orders');
    orderChart.setXAxis(['January', 'February', 'March', 'April', 'May', 'June', 'July']);
    orderChart.addSeries('Orders', [3, 5, 8, 6, 10, 12, 15]);
    orderChart.setID('orderChart');


    const categoryChart = visuals.pieChart("Sales by Category")
      .setLabels(["Cups", "Shirts", "Stickers"])
      .setValues([120, 80, 50])
      .setID("salesByCategory");
    const pieChart = visuals.pieChart('Sales by Category');
    pieChart.setLabels(['Cups', 'Shirts', 'Stickers']);
    pieChart.setValues([120, 80, 50]);
    pieChart.setID('salesByCategory');
    const kpi1 = visuals.kpi("Revenue (Today)", 482.57)
      .setPrefix("$")
      .setDelta(12.4, "up")
      .setHelpText("vs. previous day");

    const kpi2 = visuals.kpi("Orders (Today)", 23)
      .setDelta(5.2, "down")
      .setHelpText("vs. previous day");
    const kpi3 = visuals.kpi("Orders (Today)", 23)
      .setDelta(5.2, "down")
      .setHelpText("vs. previous day");
    const kpi4 = visuals.kpi("Orders (Today)", 23)
      .setDelta(5.2, "down")
      .setHelpText("vs. previous day");

    const productTable = visuals.table('Product Performance')
      .setSubtitle('Sorted by revenue. Highlighting low and overstock inventory.')
      .setModifierClass('data-table--products')
      .addColumn({ key: 'name', label: 'Product' })
      .addColumn({ key: 'sku', label: 'SKU' })
      .addColumn({ key: 'category', label: 'Category' })
      .addColumn({ key: 'revenue', label: 'Revenue', align: 'right' })
      .addColumn({ key: 'unitsSold', label: 'Units Sold', align: 'right' })
      .addColumn({ key: 'stock', label: 'Stock', align: 'right', className: 'col--stock', rawHtml: true });

    rows.forEach((r) => productTable.addRow(r));
    productTable
      .setRowClassGetter((row) => {
        if (row.stockStatus === 'low' || row.stockStatus === 'over') {
          return 'row--danger';
        }
        return '';
      })
      .setCellClassGetter((col, row) => {
        if (col.key === 'stock') {
          if (row.stockStatus === 'low') return 'badge badge--danger';
          if (row.stockStatus === 'over') return 'badge badge--over';
          return 'badge badge--ok';
        }
        return '';
      });

    // ========= Funnel Chart Example =========

    const checkoutFunnel = visuals.funnelChart("Checkout Funnel")
      .setLabels([
        "Visitors",
        "Product Views",
        "Add to Cart",
        "Checkout Started",
        "Purchased",
      ])
      .setValues([1000, 600, 250, 140, 90])
      .setID("checkoutFunnel");

    const heatmap = visuals.heatMap("Revenue by State (Last 30 Days)")
      .addPoint("WI", 1200)
      .addPoint("CA", 5400)
      .addPoint("TX", 3100)
      .addPoint("NY", 2800)
      .addPoint("FL", 1900)
      .setID("revenueByState");

    return {
      chart1: revenueChart,
      chart2: orderChart,
      pie1: categoryChart,
      pie2: pieChart,
      kpis: [kpi1, kpi2, kpi3, kpi4],
      funnel1: checkoutFunnel,
      productTable,
      heatmap,
      flash: req.session?.flash
    }
  }
});



module.exports = router;