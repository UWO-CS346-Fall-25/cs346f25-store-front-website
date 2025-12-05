const debug = require('debug')('app:errorManager');

function applyContext(object, ctx) {
  if (ctx == undefined) {
    object.errors.push('No context to apply');
  }
  if (ctx.error) {
    object.errors.push(ctx.error);
  }
  return hasErrors(object);
}

function hasErrors(object) {
  return object.errors && object.errors.length > 0;
}

function throwCritical(object) {
  return object.next(new Error(object.errors[0] || 'Unknown critical error'));
}

function throwError(object, message, url = null) {
  debug.error(message);
  object.session.flash = {
    error: message || object.errors[0] || 'Unknown error',
    errorList: object.errorsMap,
  };
  return object.res.redirect(url || object.url || '/');
}

function addError(object, message, mapKey = null) {
  object.errors.push(message);
  if (mapKey) {
    object.errorsMap[mapKey] = message;
  }
}
function passwordChecker(
  object,
  { newAccount = false, currentPassword, newPassword, confirmPassword, email }
) {
  if (!newAccount) {
    if (!currentPassword)
      addError(object, 'Current password is required', 'currentPassword');
  } else {
    if (!email) addError(object, 'Email is required for new accounts', 'email');
  }
  if (!newPassword) addError(object, 'New password is required', 'newPassword');
  if (newPassword && newPassword.length < 8) {
    addError(
      object,
      'New password must be at least 8 characters',
      'newPassword'
    );
  }
  if (!confirmPassword)
    addError(object, 'Please confirm your new password', 'confirmPassword');
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    addError(object, 'Passwords do not match', 'confirmPassword');
  }
}
function verify(object, error, key = null) {
  if (error) {
    addError(object, error.message || 'An error occurred', key);
    return true;
  }
  return false;
}
function throwSuccess(object, message, route = null) {
  if (hasErrors(object)) {
    return throwError(object);
  }
  object.session.flash = {
    success: message || 'Operation completed successfully.',
    errorList: object.errorsMap,
  };
  return object.res.redirect(route || object.url || '/');
}

function generate(req, res, next, { url } = {}) {
  const ctx = {
    status: res.statusCode || 500,
    req,
    res,
    next,
    session: req.session,
    url: url || req.originalUrl || '/',
    errors: [],
    errorsMap: {},
  };

  ctx.applyContext = (other) => applyContext(ctx, other);
  ctx.has = () => hasErrors(ctx);
  ctx.passwordChecker = (options) => passwordChecker(ctx, options);
  ctx.throwCritical = () => throwCritical(ctx);
  ctx.throwError = (message, url = null) => throwError(ctx, message, url);
  ctx.verify = (error, key = null) => verify(ctx, error, key);
  ctx.throwSuccess = (message, route = null) =>
    throwSuccess(ctx, message, route);
  ctx.addError = (message, mapKey = null) => addError(ctx, message, mapKey);

  return ctx;
}

module.exports = generate;
