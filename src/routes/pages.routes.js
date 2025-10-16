const express = require('express');
const router = express.Router();
const csrf = require('csurf');

const csrfProtection = csrf({ cookie: false });

router.get('/', csrfProtection, (req, res) => {
  res.render('home', {
    title: 'Home',
    csrfToken: req.csrfToken(),
  });
});


router.get('/about', csrfProtection, (req, res, next) => {
  res.render(
    'about',
    { title: 'About Us', csrfToken: req.csrfToken() },
    (err, html) => {
      if (err) throw new Error('Error rendering about page');
      res.send(html);
    }
  );
});


module.exports = router;