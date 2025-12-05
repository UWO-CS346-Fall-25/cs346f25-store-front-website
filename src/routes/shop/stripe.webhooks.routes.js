const express = require('express');
const router = express.Router();
const { stripe } = require('../../models/stripe');

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabase = require('../../models/supabase.js');
const debug = require('../../controllers/debug.js')('Stripe');

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
      debug.error('Webhook signature failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      try {
        await handleCheckoutCompleted(session, db); // your big function
      } catch (e) {
        debug.error('Failed to handle checkout.session.completed:', e);
        return res.sendStatus(500); // let Stripe retry
      }
    }

    res.sendStatus(200);
  }
);
async function handleCheckoutCompleted(session, db) {
  // 1) user_id from metadata (optional – allow guests)
  const userIdRaw = session.metadata?.user_id;
  const userId =
    typeof userIdRaw === 'string' && UUID_RE.test(userIdRaw) ? userIdRaw : null;

  if (!userId) {
    debug.warn('Creating order without user_id (guest checkout)', {
      sessionId: session.id,
      userIdRaw,
    });
  }

  // 2) Fetch line items with price expanded (to get metadata + unit_amount)
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
    expand: ['data.price.product'],
  });

  debug.log('Completed checkout:', {
    sessionId: session.id,
    userId,
    lineItems: lineItems.data.map((li) => ({
      id: li.id,
      description: li.description,
      quantity: li.quantity,
      price_id: li.price?.id,
      product_meta: li.price?.product?.metadata,
      product_id_meta: li.price?.product?.metadata?.product_id,
    })),
  });

  // 3) Derive address from session (shipping preferred, else customer_details.address)
  const { customer_details, shipping, total_details } = session;
  const addressSource = shipping?.address || customer_details?.address;

  if (
    !addressSource ||
    !addressSource.line1 ||
    !addressSource.city ||
    !addressSource.postal_code ||
    !addressSource.country
  ) {
    debug.error('Missing required address fields on checkout session', {
      sessionId: session.id,
      shipping,
      customer_details,
    });
    throw new Error('Missing required address fields on checkout session');
  }

  const address_full_name =
    shipping?.name || customer_details?.name || 'Guest Customer';

  // 4) Build order payload
  // NOTE: subtotal_cents & total_cents will be recalculated by triggers
  const orderPayload = {
    user_id: userId, // can be null
    shipping_cents: total_details?.amount_shipping ?? 0,
    tax_cents: total_details?.amount_tax ?? 0,
    // subtotal_cents & total_cents default to 0; triggers will fix them

    currency: (session.currency || 'usd').toUpperCase(),
    status: 'processing',

    address_full_name,
    address_line1: addressSource.line1,
    address_line2: addressSource.line2 || null,
    address_city: addressSource.city,
    address_region: addressSource.state || null, // Stripe uses `state`
    address_postal_code: addressSource.postal_code,
    address_country_code: addressSource.country,
    address_phone: customer_details?.phone || null,
  };

  debug.log('Inserting order with payload:', orderPayload);

  // 5) Insert order
  const { data: order, error: orderError } = await db
    .from('orders')
    .insert(orderPayload)
    .select()
    .single();

  if (orderError) {
    debug.error('Error inserting order for session', session.id, orderError);
    throw orderError;
  }

  debug.log('Order inserted for session', session.id, {
    order_id: order.id,
    order_number: order.number,
  });

  // 6) Prepare order_items payload
  // ... after successfully inserting the order

  const itemsPayload = [];

  for (const item of lineItems.data) {
    const price = item.price;
    const product = price?.product;

    if (!price || !product) {
      debug.error('Line item missing price or product', {
        sessionId: session.id,
        lineItemId: item.id,
      });
      throw new Error('Line item missing price/product on checkout session');
    }

    const productMeta = product.metadata || {};
    const productId = productMeta.product_id;

    if (!productId) {
      debug.error(
        'Missing product_id in product.metadata; did you set product_data.metadata.product_id when creating the session?',
        {
          sessionId: session.id,
          lineItemId: item.id,
          priceId: price.id,
          productId: product.id,
          productMeta,
        }
      );
      throw new Error(
        'Missing product_id in Stripe product metadata; cannot create order_items'
      );
    }

    const quantity = item.quantity ?? 1;
    const unitPriceCents = price.unit_amount;

    if (unitPriceCents == null) {
      debug.error('Missing unit_amount on price', {
        sessionId: session.id,
        priceId: price.id,
      });
      throw new Error('Missing unit_amount on Stripe price');
    }

    itemsPayload.push({
      order_id: order.id,
      product_id: productId, // <- your products.id from metadata
      sku: productMeta.sku || null, // if you add sku to metadata later
      name: item.description || product.name || 'Product',
      quantity,
      unit_price_cents: unitPriceCents,
      // total_cents is generated by DB
    });
  }

  if (itemsPayload.length === 0) {
    debug.warn(
      'No line items found for session; order will have no order_items',
      { sessionId: session.id }
    );
    return;
  }

  debug.log('Inserting order_items:', itemsPayload);

  const { error: itemsError } = await db
    .from('order_items')
    .insert(itemsPayload);

  if (itemsError) {
    debug.error(
      'Error inserting order_items for session',
      session.id,
      itemsError
    );
    // optional: rollback the order
    throw itemsError;
  }

  debug.log('Order and items successfully inserted for session', session.id);
}

module.exports = router;
