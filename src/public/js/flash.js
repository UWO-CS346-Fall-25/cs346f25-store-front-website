// Dismissible flash alerts
// - Close button removes the alert
// - Success alerts auto-dismiss after a short timeout

document.addEventListener('DOMContentLoaded', function () {
  document.body.addEventListener('click', function (e) {
    const btn = e.target.closest('.alert__close');
    if (!btn) return;
    const alertEl = btn.closest('.alert');
    if (!alertEl) return;
    alertEl.remove();
  });

  // Auto-dismiss success alerts
  const successAlerts = document.querySelectorAll('.alert--success');
  successAlerts.forEach((el) => {
    setTimeout(() => el.remove(), 4500);
  });
});
