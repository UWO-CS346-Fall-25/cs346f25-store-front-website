const supabaseClient = require('../models/supabase');

async function authMiddleware(req, res, next) {
  const supabase = supabaseClient(req);
  const token = req.cookies['sb-access-token'];
  res.locals.user = null;
  res.locals.isAdmin = false;

  if (!token) {
    req.user = null;
    req.isAdmin = false;
    return next();
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    // invalid/expired token
    req.user = null;
    req.isAdmin = false;
    return next();
  }

  const user = data.user;
  const role = user.app_metadata?.role;

  req.user = user;
  req.isAdmin = role === 'admin';

  res.locals.user = user;
  res.locals.isAdmin = req.isAdmin;

  next();
}

module.exports = authMiddleware;
