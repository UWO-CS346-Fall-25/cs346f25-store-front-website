const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { bind } = require('express-page-registry');
const db = require('../../models/productDatabase.js');
const { masterClient } = require('../../models/supabase.js');
const { authRequired, adminRequired } = require('../../middleware/accountRequired.js');
const dbStats = require('../../controllers/dbStats.js');

const csrfProtection = csrf({ cookie: false });

const logs = require('../../controllers/debug.js');
const utilities = require('../../models/admin-utilities.js');
const supabase = require('../../models/supabase.js');


bind(router, {
  route: '/',
  view: 'admin/dashboard',
  middleware: [authRequired, adminRequired, csrfProtection, require('../../middleware/csrfLocals.js')],
  meta: { title: 'Admin Dashboard' },
  getData: async function (req) {
    const flash = req.session?.flash;
    if (req.session) {
      delete req.session.flash;
    }
    try {
      const utilList = require('../../models/admin-utilities.js');
      const supabase = require('../../models/supabase.js').masterClient();
      const fs = require('fs').promises;

      // Compute a few useful counts for dashboard badges
      let pendingOrdersCount = 0;
      try {
        const { error, count } = await supabase
          .from('orders_view')
          .select('id', { count: 'exact', head: true })
          .in('status', ['processing', 'packed', 'awaiting_shipment']);

        dbStats.increment();
        if (!error && typeof count === 'number') pendingOrdersCount = count;
      } catch (e) {
        console.error('Error counting pending orders for dashboard:', e);
      }

      // Logs count (use debug controller).
      // Count only errors that have NOT been marked as viewed in the current session.
      let logsCount = 0;
      let logsErrorCount = 0;
      try {
        const logs = require('../../controllers/debug.js');
        const all = logs.getAllLogs();
        logsCount = Array.isArray(all) ? all.length : 0;
        // get set of already-viewed log ids from session (persist per admin session)
        const viewedSet = new Set((req.session && Array.isArray(req.session.viewedLogs)) ? req.session.viewedLogs : []);
        if (Array.isArray(all)) {
          logsErrorCount = all.filter(e => String(e.level || '').toLowerCase() === 'error' && !viewedSet.has(e.id)).length;
        }
      } catch (e) {
        console.error('Error computing logs count for dashboard:', e);
      }

      // TODO count: count unchecked list items in docs/TODO.md
      let todoOpenCount = 0;
      try {
        const todoPath = require('path').join(__dirname, '..', '..', 'docs', 'TODO.md');
        const md = await fs.readFile(todoPath, { encoding: 'utf8' });
        if (md) {
          const matches = md.match(/- \[ \]/g);
          todoOpenCount = matches ? matches.length : 0;
        }
      } catch (e) {
        // ignore if file not present
      }

      // Count draft products for Products Manager badge
      let draftProductsCount = 0;
      try {
        const database = require('../../models/db.js');
        const r = await database.query("SELECT COUNT(*) AS cnt FROM public.products WHERE status = 'draft'");
        dbStats.increment();
        if (r && r.rows && r.rows[0]) {
          draftProductsCount = Number(r.rows[0].cnt) || 0;
        }
      } catch (e) {
        console.error('Error counting draft products for dashboard:', e);
      }

      const utilities = utilList.map(u => {
        const copy = Object.assign({}, u);
        if (copy.id === 'orders') copy.count = pendingOrdersCount || 0;
        else if (copy.id === 'products') {
          // show number of drafts on Products Manager
          copy.count = draftProductsCount || 0;
        }
        else if (copy.id === 'logs') {
          // For logs we provide both overall count and errorCount; show error badge for errors
          copy.count = logsCount || 0;
          copy.errorCount = logsErrorCount || 0;
        }
        else if (copy.id === 'todo') copy.count = todoOpenCount || 0;
        else copy.count = 0;
        return copy;
      });

      return { flash, utilities };
    } catch (err) {
      console.error('Error preparing admin dashboard data:', err);
      return { flash, utilities: require('../../models/admin-utilities.js') };
    }
  }
});


router.use('/', require('./dashboards/cache.routes.js'));
router.use('/', require('./dashboards/database.routes.js'));
router.use('/', require('./dashboards/logs.routes.js'));
router.use('/', require('./dashboards/messages.routes.js'));
router.use('/', require('./dashboards/orders.routes.js'));
router.use('/', require('./dashboards/products.routes.js'));
router.use('/', require('./dashboards/todo.routes.js'));
router.use('/', require('./dashboards/users.routes.js'));




module.exports = router;