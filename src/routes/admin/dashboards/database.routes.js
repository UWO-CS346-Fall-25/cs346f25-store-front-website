
const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { bind } = require('express-page-registry');
const db = require('../../../models/productDatabase.js');
const { masterClient } = require('../../../models/supabase.js');
const { authRequired, adminRequired } = require('../../../middleware/accountRequired.js');
const dbStats = require('../../../controllers/dbStats.js');

const csrfProtection = csrf({ cookie: false });

const logs = require('../../../controllers/debug.js');
const utilities = require('../../../models/admin-utilities.js');
const supabase = require('../../../models/supabase.js');

bind(router, {
  route: '/stats',
  view: 'admin/stats',
  meta: { title: 'Database', flash: {} },
  middleware: [authRequired, adminRequired, csrfProtection, require('../../../middleware/csrfLocals.js')],
});

// Data endpoint (GET) — protected for admins
router.get('/stats/data', authRequired, adminRequired, (req, res) => {
  const minutes = parseInt(req.query.minutes, 10) || 60;
  const series = dbStats.getSeries(minutes);
  res.json({ series, total: dbStats.getTotal() });
});

// Reset endpoint (POST) — protected and CSRF-protected
router.post('/stats/reset', authRequired, adminRequired, csrfProtection, require('../../../middleware/csrfLocals.js'), (req, res) => {
  dbStats.reset();
  res.json({ ok: true });
});

module.exports = router;
