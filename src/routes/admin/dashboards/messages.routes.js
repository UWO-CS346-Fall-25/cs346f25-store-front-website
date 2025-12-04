
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
  route: '/message-senders',
  view: 'admin/message-senders',
  meta: { title: 'Message Senders' },
  middleware: [authRequired, adminRequired, csrfProtection, require('../../../middleware/csrfLocals.js')],
  getData: async function (req) {
    const flash = req.session?.flash;
    if (req.session) delete req.session.flash;
    try {
      // Select users who have sent messages (is_from_user = true) and the last message for each

      // Gets last messages
      // data is an array of:
      // { user_id: string, display_name: string, last_body: string, last_at: string }
      const { data, error } = await supabase.masterClient()
        .from('unread_messages')
        .select('user_id, name, body, unread, created_at')
        .order('created_at', { ascending: false });
      dbStats.increment();

      if (error) {
        console.error(error);
      }
      const rows = (data && data.length) ? data : [];
      return { flash, senders: rows };
    } catch (err) {
      console.error('Error preparing message-senders admin page:', err);
      return { flash, senders: [] };
    }
  }
});
// Admin: view a message thread for a specific user
bind(router, {
  route: '/messages/thread',
  view: 'messages/admin',
  meta: { title: 'Message Thread' },
  middleware: [authRequired, adminRequired, csrfProtection, require('../../../middleware/csrfLocals.js')],
  getData: async function (req) {
    const flash = req.session?.flash;
    if (req.session) delete req.session.flash;
    const userId = (req.query && (req.query.user || req.query.recipient)) ? String(req.query.user || req.query.recipient) : null;
    if (!userId) return { flash, messages: [], recipient: '' };

    try {
      const sup = supabase.masterClient();
      // Fetch messages for the selected user (admin view)
      const { data, error } = await sup
        .from('messages')
        .select('id, user_id, is_from_user, body, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      dbStats.increment();

      if (error) console.error('Error fetching thread messages for admin:', error);

      let recipient_display = "Anonymous";
      try {
        const { data: listData, error: userErr } = await sup.auth.admin.getUserById(userId);
        dbStats.increment();
        if (userErr) {
          console.error('Error fetching user for order listing:', userErr);
          return null;
        }
        recipient_display = listData.user ? listData.user.user_metadata.display_name : "Anonymous";
      } catch (e) {
        console.error('Error fetching user display name for admin message thread:', e);
      }

      // Mark server/admin-originated messages as read for this user when they open their inbox
      try {
        await sup
          .from('unread_messages')
          .update({ unread: false })
          .eq('user_id', userId);
      } catch (e) {
        console.error('Error marking user messages as read:', e);
      }


      return { flash, messages: (data && data.length) ? data : [], recipient: userId, recipient_display };
    } catch (err) {
      console.error('Error preparing admin message thread page:', err);
      return { flash, messages: [], recipient: userId || '' };
    }
  }
});
// Admin: Send message page (renders the send form for admins)
bind(router, {
  route: '/messages/send',
  view: 'messages/send',
  meta: { title: 'Send Message' },
  middleware: [authRequired, adminRequired, csrfProtection, require('../../../middleware/csrfLocals.js')],
  getData: async function (req) {
    const flash = req.session?.flash;
    if (req.session) delete req.session.flash;
    // Prefill recipient from query string (recipient can be user id or email)
    const recipient = req.query && req.query.recipient ? String(req.query.recipient) : '';
    return { flash, recipient };
  }
});


module.exports = router;