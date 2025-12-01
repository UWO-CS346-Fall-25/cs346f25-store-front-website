const express = require('express');
const router = express.Router();
const controller = require('../../controllers/adminStatsController');

const csrf = require('csurf');
const { bind } = require('express-page-registry');
const db = require('../../models/productDatabase.js');
const { masterClient } = require('../../models/supabase.js');
const { authRequired, adminRequired } = require('../../middleware/accountRequired.js');

const csrfProtection = csrf({ cookie: false });

const logs = require('../../controllers/debug.js');
const utilities = require('../../models/admin-utilities.js');


bind(router, {
  route: '/stats',
  view: 'admin/stats',
  meta: { title: 'Database', flash: {} },
  middleware: [authRequired, adminRequired, csrfProtection, require('../../middleware/csrfLocals.js')],
});

router.get('/stats/data', (req, res) => {

  const minutes = parseInt(req.query.minutes, 10) || 60;
  const series = dbStats.getSeries(minutes);
  res.json({ series, total: dbStats.getTotal() });
});
router.post('/stats/reset', (req, res) => {
  dbStats.reset();
  res.json({ ok: true });
});

module.exports = router;
