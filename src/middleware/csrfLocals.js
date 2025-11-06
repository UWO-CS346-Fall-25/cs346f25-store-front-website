
function csrfLocals(req, res, next) {
  if (typeof req.csrfToken === 'function') {
    try {
      res.locals.csrfToken = req.csrfToken();
    } catch (err) {
      res.locals.csrfToken = null;
    }
  } else {
    res.locals.csrfToken = null;
  }
  next();
}

module.exports = csrfLocals;