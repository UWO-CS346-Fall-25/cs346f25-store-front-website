const eBayApi = require('ebay-api');

const ebay = eBayApi.fromEnv(); // reads EBAY_* vars

// Set OAuth scope for REST calls (Browse, etc.)
ebay.OAuth2.setScope([
  process.env.EBAY_SCOPE || 'https://api.ebay.com/oauth/api_scope',
]);

// If you want affiliate URLs returned by Browse (itemAffiliateWebUrl),
// pass the X-EBAY-C-ENDUSERCTX values via the SDK's REST config:
const endUserCtx = [];
if (process.env.EPN_CAMPAIGN_ID) {
  endUserCtx.push(`affiliateCampaignId=${process.env.EPN_CAMPAIGN_ID}`);
}
if (process.env.EPN_REFERENCE_ID) {
  endUserCtx.push(`affiliateReferenceId=${process.env.EPN_REFERENCE_ID}`);
}

// Apply headers for *all* Browse calls
if (endUserCtx.length) {
  ebay.buy.browse.api({
    headers: { 'X-EBAY-C-ENDUSERCTX': endUserCtx.join(',') },
  });
}

module.exports = { ebay };
