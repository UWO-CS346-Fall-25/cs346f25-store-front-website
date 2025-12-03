const express = require('express');
const router = express.Router();

const database = require('../models/productDatabase.js');
const { authClient, masterClient } = require('../models/supabase');
const { adminRequired } = require('../middleware/accountRequired');

// Messages API
// GET /api/messages -> returns messages for current user (RLS will enforce visibility)
router.get('/api/messages', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const supabase = authClient(req);
    const { data, error } = await supabase
      .from('messages')
      .select('id, user_id, is_from_user, body, parent_id, is_read, created_at')
      .order('created_at', { ascending: true });
    require('../controllers/dbStats.js').increment();
    if (error) return res.status(500).json({ error: error.message || String(error) });
    return res.json({ ok: true, messages: data });
  } catch (err) {
    console.error('Error fetching messages:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/messages -> create a new message from current user
router.post('/api/messages', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const supabase = authClient(req);
    const { body, parent_id } = req.body || {};
    if (!body || typeof body !== 'string' || !body.trim()) return res.status(400).json({ error: 'Message body required' });

    const row = {
      user_id: req.user.id,
      is_from_user: true,
      body: body.trim(),
      parent_id: parent_id || null,
    };

    const { data, error } = await supabase.from('messages').insert(row).select().maybeSingle();
    if (error) return res.status(500).json({ error: error.message || String(error) });
    return res.json({ ok: true, message: data });
  } catch (err) {
    console.error('Error creating message:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Admin: create a message as the server/admin for a given user
router.post('/api/admin/messages', adminRequired, async (req, res) => {
  try {
    const { recipient, body, parent_id } = req.body || {};
    if (!recipient || typeof recipient !== 'string' || !recipient.trim()) return res.status(400).json({ error: 'Recipient required' });
    if (!body || typeof body !== 'string' || !body.trim()) return res.status(400).json({ error: 'Message body required' });

    const supabase = masterClient();
    const row = {
      user_id: recipient,
      is_from_user: false,
      body: body.trim(),
      parent_id: parent_id || null,
    };

    const { data, error } = await supabase.from('messages').insert(row).select().maybeSingle();
    if (error) return res.status(500).json({ error: error.message || String(error) });
    return res.json({ ok: true, message: data });
  } catch (err) {
    console.error('Error creating admin message:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/featured', async (req, res) => {
  const featuredProducts = await database.getFeatured();
  res.json(featuredProducts);
});
router.get('/api/categories', async (req, res) => {
  const categories = await database.getCategories();
  res.json(categories);
});
router.get('/api/new-arrivals', async (req, res) => {
  let count = parseInt(req.query.count) || 8;
  if (count < 1) count = 1;
  if (count > 50) count = 50;
  const newArrivals = await database.getNewArrivals(count);
  res.json(newArrivals);
});

router.get('/api/current-theme', async (req, res) => {
  const themeData = await require("../models/themeDatabase.js").getCurrentTheme();
  res.json(themeData);
});
router.get('/api/themes', async (req, res) => {
  const themes = await require("../models/themeDatabase.js").getAllThemes();
  res.json(themes);
});
router.get('/api/theme/:name', async (req, res) => {
  const { name } = req.params;
  let themeData = null;
  if (name === 'auto') themeData = await require("../models/themeDatabase.js").getCurrentTheme();
  else themeData = await require("../models/themeDatabase.js").getThemeByKey(name);

  if (themeData == null) return res.status(400).json({ error: "Unknown theme" });
  res.json({ ok: true, theme: themeData });
});



module.exports = router;