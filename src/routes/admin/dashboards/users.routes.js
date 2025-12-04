
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
  route: '/users',
  view: 'admin/users',
  meta: { title: 'Users' },
  middleware: [authRequired, adminRequired, csrfProtection, require('../../../middleware/csrfLocals.js')],
  getData: async function (req) {
    const flash = req.session?.flash;
    if (req.session) {
      delete req.session.flash;
    }
    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Number(req.query.perPage) || 10;
    const q = (req.query.q || '').trim();

    try {
      const supabase = masterClient();

      // If no search query, use the simple paged admin API
      if (!q) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
        dbStats.increment();

        if (error) {
          console.error('Error listing users:', error);
          return { users: [], flash: { error: 'Unable to load users' }, paging: { page, perPage, totalPages: 1 }, q };
        }

        const users = (data && data.users) || [];
        const total = (data && data.total) || null;
        const totalPages = total ? Math.max(1, Math.ceil(total / perPage)) : page;
        return {
          users,
          flash,
          paging: { page, perPage, totalPages },
          q,
        };
      }

      // If a search query is provided, fetch all users (page through the admin API),
      // filter on the server, then paginate the filtered results.
      const fetchPerPage = 100; // batch size for fetching users while searching
      let fetchPage = 1;
      let allUsers = [];
      let shouldContinue = true;

      while (shouldContinue) {
        const { data, error } = await supabase.auth.admin.listUsers({ page: fetchPage, perPage: fetchPerPage });
        dbStats.increment();
        if (error) {
          console.error('Error listing users while searching:', error);
          break;
        }

        const batch = (data && data.users) || [];
        allUsers = allUsers.concat(batch);

        // If returned fewer than requested, we reached the end
        if (batch.length < fetchPerPage) {
          shouldContinue = false;
        } else if (data && typeof data.total === 'number') {
          const totalPagesRemote = Math.max(1, Math.ceil(data.total / fetchPerPage));
          if (fetchPage >= totalPagesRemote) shouldContinue = false;
        } else {
          fetchPage++;
        }
      }

      const qlc = q.toLowerCase();
      const filtered = allUsers.filter(u => {
        const email = (u.email || '').toLowerCase();
        const display = (u.display_name || '').toLowerCase();
        const meta = u.user_metadata ? JSON.stringify(u.user_metadata).toLowerCase() : '';
        return email.includes(qlc) || display.includes(qlc) || meta.includes(qlc);
      });

      const totalMatches = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalMatches / perPage));

      // slice results for the requested page
      const start = (page - 1) * perPage;
      const usersPage = filtered.slice(start, start + perPage);

      return {
        users: usersPage,
        flash,
        paging: { page, perPage, totalPages },
        q,
      };
    } catch (err) {
      console.error('Exception listing users:', err);
      return { users: [], flash: { error: 'Unable to load users' }, paging: { page, totalPages: 1 }, q };
    }
  }
});




// ====================================================
// =================== USER ADMIN =====================
// ====================================================

// POST /admin/users/:id/set-role  -> body: role=admin|user|banned
router.post('/users/:id/set-role', authRequired, adminRequired, csrfProtection, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body || {};
  const supabase = masterClient();

  const allowed = ['admin', 'staff', 'user', 'banned'];
  const desired = String(role || '').toLowerCase();
  if (!allowed.includes(desired)) {
    if (req.session) req.session.flash = { error: 'Invalid role.' };
    return res.redirect('/admin/users');
  }

  // Prevent users changing their own role
  if (req.user && String(req.user.id) === String(id)) {
    if (req.session) req.session.flash = { error: 'You cannot change your own role.' };
    return res.redirect('/admin/users');
  }

  try {
    // Fetch the target user to check their current role
    let targetUser = null;
    try {
      const { data: getData, error: getErr } = await supabase.auth.admin.getUserById(id);
      dbStats.increment();
      if (!getErr && getData) targetUser = getData.user || getData;
    } catch (e) {
      // ignore fetch error; we'll defensively block if we can't determine
    }

    const targetRole = (targetUser && (targetUser?.app_metadata?.role || targetUser?.role)) ? String(targetUser.app_metadata?.role || targetUser.role).toLowerCase() : null;

    // Disallow modifying admins (nobody can modify admin accounts)
    if (targetRole === 'admin') {
      if (req.session) req.session.flash = { error: 'Modifying admin accounts is not allowed.' };
      return res.redirect('/admin/users');
    }

    const { error } = await supabase.auth.admin.updateUserById(id, {
      app_metadata: { role: desired },
    });
    dbStats.increment();

    if (req.session) {
      req.session.flash = { error: error ? 'Failed to update role.' : null, success: error ? null : 'Role updated.' };
    }
    return res.redirect('/admin/users');
  } catch (err) {
    console.error('Error updating user role:', err);
    if (req.session) req.session.flash = { error: 'Failed to update role.' };
    return res.redirect('/admin/users');
  }
});

// POST /admin/users/:id/ban -> body: action=ban|unban
router.post('/users/:id/ban', authRequired, adminRequired, csrfProtection, async (req, res) => {
  const { id } = req.params;
  const action = (req.body && req.body.action) ? String(req.body.action).toLowerCase() : '';
  const supabase = masterClient();

  try {
    // Prevent banning/changing own status
    if (req.user && String(req.user.id) === String(id)) {
      if (req.session) req.session.flash = { error: 'You cannot ban or unban yourself.' };
      return res.redirect('/admin/users');
    }

    // Fetch target user to check role; if admin, disallow any modifications
    let targetUser = null;
    try {
      const { data: getData, error: getErr } = await supabase.auth.admin.getUserById(id);
      dbStats.increment();
      if (!getErr && getData) targetUser = getData.user || getData;
    } catch (e) {
      // ignore
    }

    const targetRole = (targetUser && (targetUser?.app_metadata?.role || targetUser?.role)) ? String(targetUser.app_metadata?.role || targetUser.role).toLowerCase() : null;
    if (targetRole === 'admin') {
      if (req.session) req.session.flash = { error: 'Modifying admin accounts is not allowed.' };
      return res.redirect('/admin/users');
    }

    if (action === 'ban') {
      // set app role to 'banned' and mark user metadata
      const { error } = await supabase.auth.admin.updateUserById(id, {
        app_metadata: { role: 'banned' },
        user_metadata: { banned: true },
      });
      dbStats.increment();
      if (req.session) req.session.flash = { error: error ? 'Failed to ban user.' : null, success: error ? null : 'User banned.' };
    } else if (action === 'unban') {
      // restore to 'user'
      const { error } = await supabase.auth.admin.updateUserById(id, {
        app_metadata: { role: 'user' },
        user_metadata: { banned: false },
      });
      dbStats.increment();
      if (req.session) req.session.flash = { error: error ? 'Failed to unban user.' : null, success: error ? null : 'User unbanned.' };
    } else {
      if (req.session) req.session.flash = { error: 'Invalid action.' };
    }
    return res.redirect('/admin/users');
  } catch (err) {
    console.error('Error banning/unbanning user:', err);
    if (req.session) req.session.flash = { error: 'Failed to update user.' };
    return res.redirect('/admin/users');
  }
});





module.exports = router;