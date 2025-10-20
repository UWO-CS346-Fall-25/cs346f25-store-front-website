(function () {
  // Show/hide toggles for both password fields
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-target');
      const input = document.getElementById(id);
      if (!input) return;
      const isPw = input.type === 'password';
      input.type = isPw ? 'text' : 'password';
      btn.setAttribute('aria-label', isPw ? 'Hide password' : 'Show password');
    });
  });

  // Live "passwords match" hint (purely client-side)
  const pw = document.getElementById('password');
  const cf = document.getElementById('confirm');
  const hint = document.getElementById('matchHint');

  function updateMatch() {
    if (!pw || !cf || !hint) return;
    if (!pw.value && !cf.value) { hint.textContent = ''; return; }
    if (pw.value === cf.value) {
      hint.textContent = 'Passwords match ✅';
      hint.style.color = '#2e7d32';
    } else {
      hint.textContent = 'Passwords do not match';
      hint.style.color = '#b00020';
    }
  }

  if (pw && cf) {
    pw.addEventListener('input', updateMatch);
    cf.addEventListener('input', updateMatch);
  }
})();
