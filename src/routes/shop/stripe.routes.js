const express = require("express");
const router = express.Router();
const csrf = require('csurf');
const productDatabase = require('../../models/productDatabase.js');
const userDatabase = require('../../models/userDatabase.js');
const { bind } = require('express-page-registry');
const stripe = require('../../models/stripe').stripe;

const csrfProtection = csrf({ cookie: false });
const { getCart, clearCart } = require('../../models/cart.js');
const errorManager = require('../../controllers/errorManager.js');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';


// ==================================================================
// ========================= Checkout ===============================
// ==================================================================
router.post('/checkout', async (req, res, next) => {
  try {
    const errors = errorManager(req, res, next, '/cart');
    const ctx = await userDatabase.getUser(req);

    if (!ctx || !ctx.id) {
      ctx.user = {
        email: req.body.email || '',
        id: undefined,
      };
    }

    const cartItems = await getCart(req);
    if (!cartItems.length) {
      return errors.throwError('Your cart is empty.');
    }

    const productIds = cartItems.map(i => i.productId);
    const uniqueProductIds = [...new Set(productIds)];

    const products = await Promise.all(
      uniqueProductIds.map(id => productDatabase.getByID(id))
    );

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
          currency: (p.currency || 'usd').toLowerCase(),
          unit_amount: priceCents,
          product_data: {
            name: p.name,
            description: p.short_description || undefined,
            metadata: {
              product_id: String(p.id),
              sku: p.sku || '',
            },
          },
        },
      });
    }

    if (!line_items.length) {
      return errors.throwError('No purchasable items in your cart.');
    }

    const sessionCreatePayload = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/cart`,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      ...(ctx.user?.email ? { customer_email: ctx.user.email } : {}),
    };

    if (ctx && ctx.id) {
      sessionCreatePayload.metadata = { user_id: String(ctx.id) };
    }

    const session = await stripe.checkout.sessions.create(sessionCreatePayload);
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
  view: 'cart/success',
  middleware: [csrfProtection, require('../../middleware/csrfLocals.js')],
  meta: {
    title: 'Checkout Successful - Thank You!'
  },
  getData: async function (req, res, next) {
    const sessionId = req.query.session_id;
    if (!sessionId) {
      return {
        session: null,
        error: 'Missing checkout session. If you just paid, please check your email for a receipt.',
      };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    // Debug: log the session payment status to help diagnose clearing issues.
    try {
      console.debug('Stripe checkout session retrieved:', { id: session?.id, payment_status: session?.payment_status, payment_intent: session?.payment_intent });
    } catch (e) {
      // ignore
    }

    // If the session indicates the payment is complete, clear the user's cart.
    // Stripe sets `payment_status` to 'paid' for successful payments. In some
    // cases the Checkout Session's `payment_status` may not be updated yet, so
    // also check the related PaymentIntent (if available) for `succeeded`.
    try {
      if (session) {
        let paid = session.payment_status === 'paid';

        // If not marked paid, try inspecting PaymentIntent status.
        if (!paid && session.payment_intent) {
          try {
            const piId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id;
            if (piId) {
              const paymentIntent = await stripe.paymentIntents.retrieve(piId);
              console.debug('Stripe PaymentIntent status:', { id: paymentIntent.id, status: paymentIntent.status });
              if (paymentIntent.status === 'succeeded') paid = true;
            }
          } catch (piErr) {
            console.error('Error retrieving PaymentIntent for session', session.id, piErr);
          }
        }

        if (paid) {
          // Avoid attempting to modify the session if headers have already
          // been sent by the page renderer (this would cause
          // "Cannot set headers after they are sent to the client").
          if (!res.headersSent) {
            clearCart(req);
            try {
              res.locals.cartCount = 0;
            } catch { }
          } else {
            console.warn('Skipping clearCart because headers already sent for session', session.id);
          }
        } else {
          console.info('Checkout session not yet marked paid; skipping cart clear for session', session.id, session.payment_status);
        }
      }
    } catch (err) {
      // Don't block rendering the success page if clearing the cart fails.
      console.error('Failed to clear cart after successful checkout:', err);
    }

    return {
      session,
      error: null,
    };
  }
});


module.exports = router;
