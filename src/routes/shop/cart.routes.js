const express = require('express');
const router = express.Router();

const productDB = require('../../models/productDatabase');
const { getCart, addToCart, updateCartItem, removeFromCart } = require('../../models/cart');
const errorManager = require('../../controllers/errorManager.js');
const { bind } = require('express-page-registry');
const util = require('../../controllers/util');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: false });


/* ─────────────────────────────────────────────
 * POST /cart/add
 * ────────────────────────────────────────────*/
router.post('/cart/add', async (req, res, next) => {
  const errors = errorManager(req, res, next, 'back');
  try {
    const { product_id, quantity, intent } = req.body || {};
    const productId = product_id;
    const qty = Math.max(1, parseInt(quantity || '1', 10) || 1);

    if (!productId) errors.throwError('Missing product.');

    // Validate product exists and is active / visible
    const product = await productDB.getByID(productId);
    if (!product || product.status !== 'active') errors.throwError('That product is not available.');

    addToCart(req, productId, qty);

    if (intent === 'buy') errors.throwError('', '/cart');

    errors.throwSuccess('Item added to your cart.', '/cart');
  } catch (err) {
    next(err);
  }
});

/* ─────────────────────────────────────────────
 * GET /cart – show cart
* ────────────────────────────────────────────*/
bind(router, {
  route: '/cart',
  view: 'cart/cart',
  middleware: [csrfProtection, require('../../middleware/csrfLocals.js')],
  meta: {
    title: 'Your Cart',
  },
  getData: async function (req, res, next) {
    const cart = getCart(req);

    if (!cart.length) {
      return {
        items: [],
        subtotalCents: 0,
        subtotalDisplay: '$0.00',
        flash: req.flash(),
      };
    }

    // Load product details for cart items
    const productIds = [...new Set(cart.map((i) => i.productId))];
    let products = await Promise.all(productIds.map((id) => productDB.getByID(id)));
    products = products.filter(Boolean);

    // Bind primary images for all products at once (mutates objects in place)
    await productDB.bindPrimaryImage(products);

    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

    let subtotalCents = 0;

    const items = cart
      .map((ci) => {
        const p = productMap[ci.productId];
        if (!p) return null;

        const priceCents = p.price_cents || 0;
        const lineTotal = priceCents * ci.quantity;
        subtotalCents += lineTotal;

        return {
          productId: p.id,
          slug: p.slug,
          name: p.name,
          quantity: ci.quantity,
          priceCents,
          priceDisplay: util.formatPrice(p),
          lineTotalCents: lineTotal,
          lineTotalDisplay: util.formatCents
            ? util.formatCents(lineTotal, p.currency || 'USD')
            : (lineTotal / 100).toFixed(2),
          currency: p.currency || 'USD',
          image: p.image || null, // comes from bindPrimaryImage
        };
      })
      .filter(Boolean);

    const subtotalDisplay = util.formatCents
      ? util.formatCents(subtotalCents)
      : (subtotalCents / 100).toFixed(2);

    return {
      items,
      subtotalCents,
      subtotalDisplay,
      flash: req.flash(),
    };
  }
});


/* ─────────────────────────────────────────────
 * POST /cart/update – update quantities
 * ────────────────────────────────────────────*/
router.post('/cart/update', (req, res, next) => {
  try {
    const errors = errorManager(req, res, next, 'back');
    const body = req.body || {};

    const quantities = {};

    // Case 1: extended: true, nested object like { quantities: { "12": "2" } }
    if (body.quantities && typeof body.quantities === 'object') {
      Object.assign(quantities, body.quantities);
    }

    // Case 2: extended: false, flat keys like { "quantities[12]": "2" }
    for (const [key, value] of Object.entries(body)) {
      const match = key.match(/^quantities\[(.+)\]$/);
      if (match) {
        const productId = match[1];
        quantities[productId] = value;
      }
    }

    if (body.product_id && body.quantity && !Object.keys(quantities).length) {
      quantities[body.product_id] = body.quantity;
    }

    Object.entries(quantities).forEach(([productId, qtyStr]) => {
      const qty = parseInt(qtyStr, 10);
      if (Number.isNaN(qty)) return;

      // If you want 0 to mean "remove", you can do:
      // if (qty <= 0) return removeFromCart(req, productId);

      updateCartItem(req, productId, qty);
    });

    errors.throwSuccess('Cart updated.', '/cart');
  } catch (err) {
    next(err);
  }
});


/* ─────────────────────────────────────────────
 * POST /cart/remove – remove item
 * ────────────────────────────────────────────*/
router.post('/cart/remove', (req, res, next) => {
  try {
    const errors = errorManager(req, res, next, 'back');
    const { product_id } = req.body || {};
    if (product_id) removeFromCart(req, product_id);
    errors.throwSuccess('Item removed from your cart.', '/cart');

  } catch (err) {
    next(err);
  }
});

module.exports = router;
