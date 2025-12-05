(function () {
  // Set initial icon state based on input type, and toggle on click
  function syncToggle(btn) {
    const id = btn.getAttribute('data-target');
    const input = document.getElementById(id);
    if (!input) return;
    btn.setAttribute('aria-pressed', input.type === 'text' ? 'true' : 'false');
    btn.setAttribute(
      'aria-label',
      input.type === 'text' ? 'Hide password' : 'Show password'
    );
  }

  document.querySelectorAll('.password-toggle').forEach((btn) => {
    syncToggle(btn);
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-target');
      const input = document.getElementById(id);
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      syncToggle(btn);
    });
  });
})();

(function () {
  document.querySelectorAll('.password-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-target');
      const input = document.getElementById(id);
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', show ? 'true' : 'false');
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  });
})();
