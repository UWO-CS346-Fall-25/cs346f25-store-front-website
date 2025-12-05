
/**
 * Cart structure in session:
 * req.session.cart = [
 *   { productId: 'uuid', quantity: 2 }
 * ]
 */

function getCart(req) {
  if (!req.session) throw new Error('Session is required for cart');
  if (!Array.isArray(req.session.cart)) {
    req.session.cart = [];
  }
  return req.session.cart;
}

function saveCart(req, cart) {
  req.session.cart = cart;
}

function addToCart(req, productId, quantity) {
  const cart = getCart(req);
  const existing = cart.find((item) => item.productId === productId);

  if (existing) {
    existing.quantity += quantity;
    if (existing.quantity < 1) existing.quantity = 1;
  } else {
    cart.push({ productId, quantity });
  }

  saveCart(req, cart);
}

function updateCartItem(req, productId, quantity) {
  const cart = getCart(req);
  const item = cart.find((i) => i.productId === productId);
  if (!item) return;
  if (quantity <= 0) {
    // remove if 0 or negative
    const idx = cart.indexOf(item);
    if (idx !== -1) cart.splice(idx, 1);
  } else {
    item.quantity = quantity;
  }
  saveCart(req, cart);
}

function removeFromCart(req, productId) {
  const cart = getCart(req);
  const next = cart.filter((i) => i.productId !== productId);
  saveCart(req, next);
}
function clearCart(req) {
  saveCart(req, []);
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
