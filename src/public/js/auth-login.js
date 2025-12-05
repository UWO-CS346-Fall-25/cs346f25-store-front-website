(function () {
  const btn = document.querySelector('.password-toggle');
  const input = document.getElementById('password');
  if (!btn || !input) return;
  btn.addEventListener('click', () => {
    const isPw = input.type === 'password';
    input.type = isPw ? 'text' : 'password';
    btn.setAttribute('aria-label', isPw ? 'Hide password' : 'Show password');
  });
})();
