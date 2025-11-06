const supabase = require('../models/supabase');

async function authMiddleware(req, res, next) {
  const token = req.cookies['sb-access-token'];

  if (!token) {
    req.user = null;
    req.isAdmin = false;
    res.locals.currentUser = null;
    res.locals.isAdmin = false;
    return next();
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    // invalid/expired token
    req.user = null;
    req.isAdmin = false;
    res.locals.currentUser = null;
    res.locals.isAdmin = false;
    return next();
  }

  const user = data.user;
  const role = user.app_metadata?.role;

  req.user = user;
  req.isAdmin = role === 'admin';

  res.locals.currentUser = user;
  res.locals.isAdmin = req.isAdmin;

  next();
}

module.exports = authMiddleware;
