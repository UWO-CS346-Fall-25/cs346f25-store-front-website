// confirm-button.js
// Handles behavior for confirm-modal-overlay instances and their trigger buttons.
(function () {
  function initInstance(overlay) {
    var id = overlay.id;
    if (!id) return;
    // avoid double-init
    if (overlay.__confirmInitialized) return;
    overlay.__confirmInitialized = true;

    var trigger = document.querySelector('[data-confirm-id="' + id + '"]');
    if (!trigger) return;

    function open() {
      overlay.style.display = 'flex';
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      var ok = overlay.querySelector('[data-confirm-ok]');
      ok && ok.focus();
    }

    function close() {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      try {
        trigger.focus();
      } catch (e) {}
    }

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      open();
    });

    var cancel = overlay.querySelector('[data-confirm-cancel]');
    var ok = overlay.querySelector('[data-confirm-ok]');
    if (cancel)
      cancel.addEventListener('click', function (e) {
        e.preventDefault();
        close();
      });
    if (ok)
      ok.addEventListener('click', function (e) {
        e.preventDefault();
        var form = trigger.closest('form');
        if (form) {
          form.submit();
        } else {
          close();
        }
      });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', function (e) {
      if (overlay.style.display === 'flex' && e.key === 'Escape') close();
    });
  }

  function initAll() {
    var overlays = document.querySelectorAll('.confirm-modal-overlay');
    overlays.forEach(function (ov) {
      initInstance(ov);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
