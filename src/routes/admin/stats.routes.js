const express = require('express');
const router = express.Router();
const dbStats = require('../../controllers/dbStats');

const csrf = require('csurf');
const { bind } = require('express-page-registry');
const { authRequired, adminRequired } = require('../../middleware/accountRequired.js');

const csrfProtection = csrf({ cookie: false });

bind(router, {
  route: '/stats',
  view: 'admin/stats',
  meta: { title: 'Database', flash: {} },
  middleware: [authRequired, adminRequired, csrfProtection, require('../../middleware/csrfLocals.js')],
});

// Data endpoint (GET) — protected for admins
router.get('/stats/data', authRequired, adminRequired, (req, res) => {
  const minutes = parseInt(req.query.minutes, 10) || 60;
  const series = dbStats.getSeries(minutes);
  res.json({ series, total: dbStats.getTotal() });
});

// Reset endpoint (POST) — protected and CSRF-protected
router.post('/stats/reset', authRequired, adminRequired, csrfProtection, require('../../middleware/csrfLocals.js'), (req, res) => {
  dbStats.reset();
  res.json({ ok: true });
});

module.exports = router;
