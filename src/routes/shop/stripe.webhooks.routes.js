const express = require('express');
const router = express.Router();
const { stripe } = require('../../models/stripe');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabase = require('../../models/supabase.js');

router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const db = supabase.masterClient();
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      try {
        await handleCheckoutCompleted(session, db);  // your big function
      } catch (e) {
        console.error('Failed to handle checkout.session.completed:', e);
        return res.sendStatus(500); // let Stripe retry
      }
    }

    res.sendStatus(200);
  }
);

async function handleCheckoutCompleted(session, db) {
  // 1) Optional user_id from metadata (can be null for guests)
  const userIdRaw = session.metadata?.user_id;
  const userId =
    typeof userIdRaw === 'string' && UUID_RE.test(userIdRaw) ? userIdRaw : null;

  if (!userId) {
    console.warn('Order will be created without a user_id (guest checkout)', {
      sessionId: session.id,
      userIdRaw,
    });
  }

  // 2) Line items (still useful for order_items later)
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
  });

  console.log('Completed checkout:', {
    sessionId: session.id,
    userId,
    lineItems: lineItems.data,
  });

  // 3) Get address from Stripe (shipping preferred, else billing-like)
  const { customer_details, shipping, total_details } = session;

  const addressSource = shipping?.address || customer_details?.address;

  if (
    !addressSource ||
    !addressSource.line1 ||
    !addressSource.city ||
    !addressSource.postal_code ||
    !addressSource.country
  ) {
    console.error('Missing required address fields on checkout session', {
      sessionId: session.id,
      shipping,
      customer_details,
    });
    // You can either throw (so Stripe retries) or just return.
    throw new Error('Missing required address fields on checkout session');
  }

  const address_full_name =
    shipping?.name || customer_details?.name || 'Guest Customer';

  // 4) Build order payload for your new schema
  const orderPayload = {
    user_id: userId, // can be null
    subtotal_cents: session.amount_subtotal ?? 0,
    shipping_cents: total_details?.amount_shipping ?? 0,
    tax_cents: total_details?.amount_tax ?? 0,
    total_cents: session.amount_total ?? 0,
    currency: (session.currency || 'usd').toUpperCase(),

    address_full_name,
    address_line1: addressSource.line1,
    address_line2: addressSource.line2 || null,
    address_city: addressSource.city,
    address_region: addressSource.state || null, // Stripe uses `state`
    address_postal_code: addressSource.postal_code,
    address_country_code: addressSource.country,
    address_phone: customer_details?.phone || null,

    // status, number, placed_at, updated_at all have defaults
  };

  console.log('Inserting order with payload:', orderPayload);

  // 5) Insert order via Supabase (db is your admin client)
  const { data: order, error } = await db
    .from('orders')
    .insert(orderPayload)
    .select()
    .single();

  if (error) {
    console.error('Error inserting order for session', session.id, error);
    throw error; // let webhook handler return 500 so Stripe retries
  }

  console.log('Order inserted for session', session.id, {
    order_id: order.id,
    order_number: order.number,
  });

  // 6) TODO: insert order_items using `lineItems.data` if you have that table
}


module.exports = router;
