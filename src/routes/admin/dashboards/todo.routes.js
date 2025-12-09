
const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { bind } = require('express-page-registry');
const db = require('../../../models/productDatabase.js');
const { authRequired, adminRequired } = require('../../../middleware/accountRequired.js');

const csrfProtection = csrf({ cookie: false });




// Admin TODO viewer (renders docs/TODO.md)
bind(router, {
  route: '/todo',
  view: 'admin/todo',
  meta: { title: 'Admin TODO' },
  middleware: [authRequired, adminRequired, csrfProtection, require('../../../middleware/csrfLocals.js')],
  getData: async function (req) {
    const flash = req.session?.flash;
    if (req.session) {
      delete req.session.flash;
    }
    try {
      const todoController = require('../../../controllers/todoController.js');
      const todoHtml = await todoController.getTodoHtml();
      return { flash, todoHtml };
    } catch (err) {
      console.error('Error loading TODO viewer:', err);
      return { flash, todoHtml: '<p>Unable to load TODO content.</p>' };
    }
  }
});


module.exports = router;