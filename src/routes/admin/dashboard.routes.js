const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { bind } = require('express-page-registry');

const {
  authRequired,
  adminRequired,
} = require('../../middleware/accountRequired.js');

const csrfProtection = csrf({ cookie: false });

const badges = require('../../models/admin-badges.js');
const debug = require('../../controllers/debug.js')('Routes.Admin.Dashboard');

bind(router, {
  route: '/',
  view: 'admin/dashboard',
  middleware: [
    authRequired,
    adminRequired,
    csrfProtection,
    require('../../middleware/csrfLocals.js'),
  ],
  meta: { title: 'Admin Dashboard' },
  getData: async function (req) {
    const flash = req.session?.flash;
    if (req.session) {
      delete req.session.flash;
    }
    try {
      const utilList = require('../../models/admin-utilities.js');

      // Compute a few useful counts for dashboard badges
      let pendingOrdersCount = await badges.orders();

      let logsCount = 0;
      let logsErrorCount = await badges.logs();

      let todoOpenCount = await badges.todo();
      let draftProductsCount = await badges.products();
      let messagesCount = await badges.messages();

      const utilities = utilList.map((u) => {
        const copy = Object.assign({}, u);
        if (copy.id === 'orders') copy.count = pendingOrdersCount || 0;
        else if (copy.id === 'products') {
          // show number of drafts on Products Manager
          copy.count = draftProductsCount || 0;
        } else if (copy.id === 'logs') {
          // For logs we provide both overall count and errorCount; show error badge for errors
          copy.count = logsCount || 0;
          copy.errorCount = logsErrorCount || 0;
        } else if (copy.id === 'todo') copy.count = todoOpenCount || 0;
        else if (copy.id === 'messages') copy.count = messagesCount || 0;
        else copy.count = 0;
        return copy;
      });

      // Build grouped structure from the computed copies (so counts are preserved)
      const groupedMap = new Map();
      utilities.forEach(u => {
        const cat = u.category || 'General';
        if (!groupedMap.has(cat)) groupedMap.set(cat, []);
        groupedMap.get(cat).push(u);
      });
      const groupedUtilities = Array.from(groupedMap.entries()).map(([category, items]) => ({ category, items }));

      return { flash, utilities, groupedUtilities };
    } catch (err) {
      debug.error('Error preparing admin dashboard data:', err);
      return { flash, utilities: require('../../models/admin-utilities.js') };
    }
  },
});

router.use('/', require('./dashboards/cache.routes.js'));
router.use('/', require('./dashboards/database.routes.js'));
router.use('/', require('./dashboards/logs.routes.js'));
router.use('/', require('./dashboards/messages.routes.js'));
router.use('/', require('./dashboards/orders.routes.js'));
router.use('/', require('./dashboards/products.routes.js'));
router.use('/', require('./dashboards/todo.routes.js'));
router.use('/', require('./dashboards/users.routes.js'));
router.use('/', require('./dashboards/stock.routes.js'));

router.use('/', require('./analytics/test.routes.js'));


module.exports = router;
