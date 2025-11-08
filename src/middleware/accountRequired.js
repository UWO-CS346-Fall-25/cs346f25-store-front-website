function authRequired(req, res, next) {
  if (!req.user) {
    // Save where they were trying to go
    if (req.session) {
      req.session.returnTo = req.originalUrl;
    }
    return res.redirect('/login');
  }


  next();
};
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


module.exports = { authRequired, accountRequired };

