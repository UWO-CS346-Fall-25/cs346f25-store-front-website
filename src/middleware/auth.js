// middleware/auth.js
const supabase = require('../lib/supabase');

async function authMiddleware(req, res, next) {
  const token = req.cookies['sb-access-token'];

  if (!token) {
    req.user = null;
    req.isAdmin = false;
    return next();
  }

  // Option A: ask Supabase who this is
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    // invalid/expired token
    req.user = null;
    req.isAdmin = false;
    return next();
  }

  const user = data.user;
  req.user = user;

  const role = user.app_metadata?.role;
  req.isAdmin = role === 'admin';

  // handy for templates
  res.locals.currentUser = user;
  res.locals.isAdmin = req.isAdmin;

  next();
}

module.exports = authMiddleware;
