const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { asyncWrap } = require("express-pretty-errors");


const csrfProtection = csrf({ cookie: false });

router.get('/', csrfProtection, (req, res) => {
  res.render('home', {
    title: 'Home',
    csrfToken: req.csrfToken(),
  });
});


router.get('/about', (req, res, next) => {
  res.render(
    'about',
    { title: 'About Us' }
  );
});


module.exports = router;