const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { bind } = require('express-page-registry');
const db = require('../../../models/productDatabase.js');
const { masterClient } = require('../../../models/supabase.js');
const {
  authRequired,
  adminRequired,
} = require('../../../middleware/accountRequired.js');
const dbStats = require('../../../controllers/dbStats.js');

const csrfProtection = csrf({ cookie: false });

const logs = require('../../../controllers/debug.js');
const utilities = require('../../../models/admin-utilities.js');
const supabase = require('../../../models/supabase.js');
const page_data = require('../../../models/admin-page-data.js');

bind(router, {
  route: '/logs',
  view: 'admin/admin_panel',
  middleware: [
    authRequired,
    adminRequired,
    csrfProtection,
    require('../../../middleware/csrfLocals.js'),
  ],
  meta: page_data.logs,
  getData: async function (req) {
    const flash = req.session?.flash;
    if (req.session) {
      delete req.session.flash;
    }
    // Normalize logs so `details` is always an array of readable entries.
    const rawLogs = logs.getAllLogs();
    const normalized = rawLogs.map((entry) => {
      const e = Object.assign({}, entry);
      let d = e.details;

      // If details already an array, stringify non-strings inside it
      if (Array.isArray(d)) {
        d = d.map((item) =>
          typeof item === 'string' ? item : JSON.stringify(item, null, 2)
        );
      } else if (typeof d === 'string') {
        // Try to parse JSON (could be serialized array/object)
        try {
          const parsed = JSON.parse(d);
          if (Array.isArray(parsed)) {
            d = parsed.map((item) =>
              typeof item === 'string' ? item : JSON.stringify(item, null, 2)
            );
          } else if (parsed == null) {
            d = [];
          } else {
            d = [
              typeof parsed === 'string'
                ? parsed
                : JSON.stringify(parsed, null, 2),
            ];
          }
        } catch (err) {
          // Not JSON — split on escaped or real newlines if present, otherwise wrap
          if (d.indexOf('\n') !== -1) {
            d = d.split(/\\n+/).map((s) => s);
          } else if (d.indexOf('\n') !== -1) {
            d = d.split(/\n+/).map((s) => s);
          } else {
            d = [d];
          }
        }
      } else if (d == null) {
        d = [];
      } else {
        // Anything else (object, number, etc.) -> stringify and wrap
        d = [typeof d === 'string' ? d : JSON.stringify(d, null, 2)];
      }

      e.details = d;
      return e;
    });

    logs.resetUnreadCount();

    return {
      flash,
      logs: normalized,
    };
  },
});

module.exports = router;
