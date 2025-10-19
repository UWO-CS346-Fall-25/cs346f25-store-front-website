

// simple function to set auth-related context variables for views
module.exports = function authContext() {
  return function (req, res, next) {
    res.locals.user = req.user || null;
    res.locals.isAdmin = !!(req.user && req.user.role === 'admin');
    res.locals.cartCount = Array.isArray(req.session?.cart) ? req.session.cart.length : 0;
    next();
  };
};

