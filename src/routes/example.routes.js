/**
 * Example route file demonstrating how to set up routes with CSRF protection.
 * 
 * @module routes/example
 */

const express = require('express');
const router = express.Router();
const csrf = require('csurf');

const csrfProtection = csrf({ cookie: false });

/**
 * GET /
 * Renders the home page with CSRF protection.
 */
router.get('/', csrfProtection, (req, res) => {
  res.render('example/index', {
    title: 'Home',
    csrfToken: req.csrfToken(),
  });
});


module.exports = router;