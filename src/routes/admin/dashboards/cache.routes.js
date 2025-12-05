const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { bind } = require('express-page-registry');
const {
  authRequired,
  adminRequired,
} = require('../../../middleware/accountRequired.js');

const csrfProtection = csrf({ cookie: false });
const pageData = require('../../../models/admin-page-data.js');
const debug = require('../../../controllers/debug.js')('Routes.Admin.Dashboards');

// Admin: Cache viewer
bind(router, {
  route: '/cache',
  view: 'admin/admin_panel',
  meta: pageData.cache,
  middleware: [
    authRequired,
    adminRequired,
    csrfProtection,
    require('../../../middleware/csrfLocals.js'),
  ],
  getData: async function (req) {
    const flash = req.session?.flash;
    if (req.session) delete req.session.flash;
    try {
      const cache = require('../../../controllers/cache.js');
      const raw = cache.listKeys(); // [{key, exp}]
      const items = raw.map((entry) => {
        const key = entry.key;
        const exp = entry.exp || 0;
        const now = Date.now();
        const ttlRemaining = exp === 0 ? null : Math.max(0, exp - now);
        let preview = null;
        try {
          const val = cache.get(key);
          if (val == null) preview = null;
          else if (typeof val === 'string') {
            // If it's a JSON string, pretty-print it
            try {
              const parsed = JSON.parse(val);
              preview = JSON.stringify(parsed, null, 2);
            } catch {
              preview = val;
            }
          } else {
            try {
              preview = JSON.stringify(val, null, 2);
            } catch {
              preview = String(val);
            }
          }
        } catch {
          preview = '<unserializable>';
        }
        // Truncate very large previews to avoid rendering huge blocks in the admin UI
        if (typeof preview === 'string' && preview.length > 2000)
          preview = preview.substring(0, 2000) + '\n…(truncated)';
        return { key, exp, ttlRemaining, preview };
      });

      return { flash, items };
    } catch (err) {
      debug.error('Error preparing cache admin page:', err);
      return { flash, items: [] };
    }
  },
});

// Cache management POST endpoints
// Note: placed after module export to keep similar pattern. If project lints against this, move earlier.
const cacheController = require('../../../controllers/cache.js');

router.post(
  '/cache/delete',
  authRequired,
  adminRequired,
  csrfProtection,
  async (req, res) => {
    const key = req.body && req.body.key ? String(req.body.key) : '';
    if (!key) {
      if (req.session) req.session.flash = { error: 'Key required.' };
      return res.redirect('/admin/cache');
    }
    try {
      cacheController.del(key);
      if (req.session) req.session.flash = { success: 'Key deleted.' };
      return res.redirect('/admin/cache');
    } catch (err) {
      debug.error('Error deleting cache key:', err);
      if (req.session) req.session.flash = { error: 'Failed to delete key.' };
      return res.redirect('/admin/cache');
    }
  }
);

router.post(
  '/cache/clear-namespace',
  authRequired,
  adminRequired,
  csrfProtection,
  async (req, res) => {
    const ns = req.body && req.body.ns ? String(req.body.ns) : '';
    if (!ns) {
      if (req.session) req.session.flash = { error: 'Namespace required.' };
      return res.redirect('/admin/cache');
    }
    try {
      cacheController.clearNS(ns);
      if (req.session) req.session.flash = { success: 'Namespace cleared.' };
      return res.redirect('/admin/cache');
    } catch (err) {
      debug.error('Error clearing namespace:', err);
      if (req.session)
        req.session.flash = { error: 'Failed to clear namespace.' };
      return res.redirect('/admin/cache');
    }
  }
);

router.post(
  '/cache/clear-all',
  authRequired,
  adminRequired,
  csrfProtection,
  async (req, res) => {
    try {
      cacheController.clearAll();
      if (req.session) req.session.flash = { success: 'Cache cleared.' };
      return res.redirect('/admin/cache');
    } catch (err) {
      debug.error('Error clearing cache:', err);
      if (req.session) req.session.flash = { error: 'Failed to clear cache.' };
      return res.redirect('/admin/cache');
    }
  }
);

module.exports = router;
