function formatPrice({ price_cents, currency }) {
  const amount = price_cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}


module.exports = {
  formatPrice,
};