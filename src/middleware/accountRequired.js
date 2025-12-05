function authRequired(req, res, next) {
  if (!req.user) {
    // Save where they were trying to go
    if (req.session) {
      req.session.returnTo = req.originalUrl;
    }
    return res.redirect('/login');
  }

  next();
}
function accountRequired(req, res, next) {
  // Check if the user is authenticated
  if (!req.user) {
    if (req.session) {
      req.session.returnTo = req.originalUrl;
    }
    return res.redirect('/login'); // Redirect to login if not authenticated
  }
  // Check if the user has an associated account
  if (!req.user.accountId) {
    if (req.session) {
      req.session.returnTo = req.originalUrl;
    }
    return res.redirect('/create-account'); // Redirect to account creation if no account
  }
  next();
}

function adminRequired(req, res, next) {
  // Must be logged in
  if (!req.user) {
    if (req.session) req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }

  // auth middleware sets `req.isAdmin` (true/false) — fall back to checking role
  // Treat 'staff' as an elevated role equivalent to admin for back-office access
  const isAdmin = ['admin', 'staff'].includes(
    String(req.user?.app_metadata?.role || '').toLowerCase()
  );
  if (!isAdmin) {
    if (req.session) req.session.flash = { error: 'Admin access required.' };
    return res.redirect('/');
  }

  next();
}

module.exports = { authRequired, accountRequired, adminRequired };
