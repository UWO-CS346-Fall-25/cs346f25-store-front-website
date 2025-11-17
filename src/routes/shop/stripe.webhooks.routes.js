const express = require('express');
const router = express.Router();
const { stripe } = require('../../models/stripe');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    let event;

    try {
      const sig = req.headers['stripe-signature'];
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed.', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;

          if (session.mode === 'payment' && session.payment_status === 'paid') {
            await handleCheckoutCompleted(session);
          }
          break;
        }

        // add more event types as needed
        default:
          break;
      }

      res.json({ received: true });
    } catch (err) {
      console.error('Error handling Stripe webhook:', err);
      res.status(500).send('Webhook handler error');
    }
  }
);

async function handleCheckoutCompleted(session) {

  const userId = session.metadata?.user_id || null;

  // Might want to fetch line_items to know exactly what was bought
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
  });

  console.log('Completed checkout:', {
    sessionId: session.id,
    userId,
    lineItems: lineItems.data,
  });

  // 1. Find/create shipping_address_id & billing_address_id for this user
  // 2. Insert orders(...) returning id
  // 3. Insert order_items(...) per line item
}

module.exports = router;
