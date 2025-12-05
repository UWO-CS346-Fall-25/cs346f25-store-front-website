// Handle quantity select changes for cart items
// Inline attributes like `onchange` are blocked by the site's CSP (no 'unsafe-inline'),
// so attach listeners from an external script instead.

document.addEventListener('DOMContentLoaded', function () {
  // Use event delegation so this works if items are added/removed dynamically
  document.body.addEventListener('change', function (event) {
    const el = event.target;
    if (!el.classList || !el.classList.contains('cart-item__qty-select'))
      return;

    // Find the containing form and submit it
    const form = el.closest('form');
    if (!form) return;

    // Submit the form programmatically
    form.submit();
  });
});
