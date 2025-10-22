const express = require('express');
const { ebay } = require('../controllers/ebayClient.js');
const { bind } = require('express-page-registry');

const router = express.Router();

async function callback(req, res, next) {
  console.log("eBay search callback invoked");
  try {
    const q = (req.query.q || '').toString();
    const limit = Number(req.query.limit || 24);
    const offset = Number(req.query.offset || 0);

    // Browse search params map directly to the REST API:
    // q, limit, offset, filter, sort, fieldgroups, category_ids, gtin, epid, charity_ids...
    const data = await ebay.buy.browse.search({
      q,
      limit,
      offset,
      // Example filters (uncomment if wanted):
      // filter: ['buyingOptions:{FIXED_PRICE|AUCTION}', 'price:[10..100]'],
      // sort: '-price' // see docs for options
    });

    const items = (data.itemSummaries || []).map(it => ({
      id: it.itemId,
      title: it.title,
      price: it.price,
      imageUrl: it.image?.imageUrl,
      // Prefer affiliate URL if header is set & field is returned
      url: it.itemAffiliateWebUrl || it.itemWebUrl
    }));
    console.log(q);
    console.log(limit);
    console.log(data);
    res.locals.ebay = { q, items, total: data.total || 0, limit, offset };
    next();
  } catch (err) {
    // Helpful diagnostics (the SDK already parses eBay errors)
    console.error('eBay search failed:', err?.response?.data || err);
    next(err);
  }
}




bind(router, {
  route: '/search',
  view: 'ebay/search',
  meta: { title: 'eBay Search' },
  middleware: [callback]
});

module.exports = router;