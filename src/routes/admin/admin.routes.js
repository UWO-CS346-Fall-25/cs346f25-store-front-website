const express = require('express');
const router = express.Router();


router.use(require('./orders.routes.js'));
router.use(require('./pages.routes.js'));


module.exports = router;