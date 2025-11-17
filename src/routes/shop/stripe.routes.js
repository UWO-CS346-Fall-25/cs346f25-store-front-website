const express = require("express");
const router = express.Router();
const csrf = require('csurf');
const productDatabase = require('../../models/productDatabase.js');
const userDatabase = require('../../models/userDatabase.js');
const { bind } = require('express-page-registry');
const stripe = require('../../models/stripe').stripe;

const csrfProtection = csrf({ cookie: false });
const { getCart } = require('../../models/cart.js');
const errorManager = require('../../controllers/errorManager.js');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';


// ==================================================================
// ========================= Checkout ===============================
// ==================================================================
router.post('/checkout', async (req, res, next) => {
  try {
    const errors = errorManager(req, res, next, '/cart');
    const ctx = await userDatabase.getUser(req);
    if (errors.applyContext(ctx)) {
      return errors.throwError();
    }

    const cartItems = await getCart(req);
    if (!cartItems.length) {
      return errors.throwError('Your cart is empty.');
    }

    const productIds = cartItems.map(i => i.productId);
    const uniqueProductIds = [...new Set(productIds)];

    const products = await Promise.all(uniqueProductIds.map(id => productDatabase.getByID(id)));
    const productMap = Object.fromEntries(
      products.filter(Boolean).map(p => [p.id, p])
    );

    const line_items = [];
    for (const item of cartItems) {
      const p = productMap[item.productId];
      if (!p) continue;

      const priceCents = p.price_cents || 0;
      if (priceCents <= 0) continue;

      line_items.push({
        quantity: item.quantity,
        price_data: {
          currency: p.currency || 'usd',
          unit_amount: priceCents,
          product_data: {
            name: p.name,
            description: p.short_description || undefined,
            metadata: {
              product_id: String(p.id),
            },
          },
        },
      });
    }

    if (!line_items.length) {
      return errors.throwError('No purchasable items in your cart.');
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      customer_email: ctx.user.email,
      success_url: `${BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/cart`,
      metadata: {
        user_id: String(ctx.id),
      },
    });

    // For debugging while you’re testing:
    console.log('Stripe checkout session created:', session.id, session.url);

    // This should send the browser straight to Stripe
    return res.redirect(303, session.url);
  } catch (err) {
    console.error('Error creating checkout session:', err);
    next(err);
  }
});



// ==================================================================
// ==================== Checkout Success Page =======================
// ==================================================================
bind(router, {
  route: '/checkout/success',
  view: 'checkout/success',
  middleware: [csrfProtection, require('../../middleware/csrfLocals.js')],
  meta: {
    title: 'Checkout Successful - Thank You!'
  },
  getData: async function (req, res, next) {
    const sessionId = req.query.session_id;
    console.log("Checkout success for session ID:", sessionId);
    if (!sessionId) {
      return {
        session: null,
        error: 'Missing checkout session. If you just paid, please check your email for a receipt.',
      };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return {
      session,
      error: null,
    };
  }
});


module.exports = router;
