

const express = require('express');
const router = express.Router();
// my own module that I made a long time ago. Don't wanna rewrite it.
const { notFound, errorHandler } = require("express-pretty-errors");

// Order matters: 404 first, then 500+ error handler
router.use(notFound());
router.use(errorHandler());

module.exports = router;