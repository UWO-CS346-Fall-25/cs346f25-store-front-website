// Admin logs interactions: toggle details, simple client-side filtering

document.addEventListener('DOMContentLoaded', function () {
  const table = document.querySelector('.logs-panel table');
  if (!table) return;

  // Toggle details when clicking a main row (or pressing Enter/Space when focused on it).
  // Clicking interactive elements inside a row (links, inputs, buttons) will not trigger toggle.
  function toggleDetailForRow(tr) {
    if (!tr || tr.classList.contains('detail-row')) return;
    const next = tr.nextElementSibling;
    if (!next || !next.classList.contains('detail-row')) return;

    const isOpen = next.classList.contains('show');

    // Close others
    document.querySelectorAll('.detail-row.show').forEach(r => {
      if (r !== next) {
        r.classList.remove('show');
        r.setAttribute('aria-hidden', 'true');
        const prev = r.previousElementSibling;
        if (prev) {
          prev.setAttribute('aria-expanded', 'false');
        }
      }
    });

    if (isOpen) {
      next.classList.remove('show');
      next.setAttribute('aria-hidden', 'true');
      tr.setAttribute('aria-expanded', 'false');
    } else {
      next.classList.add('show');
      next.setAttribute('aria-hidden', 'false');
      tr.setAttribute('aria-expanded', 'true');
      next.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  table.addEventListener('click', function (e) {
    const el = e.target;
    // Ignore clicks inside the detail rows
    const tr = el.closest('tr');
    if (!tr || tr.classList.contains('detail-row')) return;

    // If click originated from an interactive control, don't toggle
    if (el.closest('a, button, input, select, textarea')) return;

    toggleDetailForRow(tr);
  });

  // Keyboard support: Enter or Space toggles when a main row is focused
  table.addEventListener('keydown', function (e) {
    const tr = e.target && e.target.closest && e.target.closest('tr');
    if (!tr || tr.classList.contains('detail-row')) return;
    if (e.key === 'Enter' || e.key === ' ') {
      // prevent page scroll on Space
      e.preventDefault();
      toggleDetailForRow(tr);
    }
  });

  // Simple level filter
  const levelFilter = document.getElementById('log-level-filter');
  if (levelFilter) {
    levelFilter.addEventListener('change', function () {
      const val = levelFilter.value;
      document.querySelectorAll('.logs-panel tbody tr').forEach(tr => {
        if (!val) {
          tr.style.display = '';
        } else {
          tr.style.display = tr.classList.contains('level-' + val) ? '' : 'none';
        }
      });
    });
  }

  // Simple text filter (client-side)
  const search = document.getElementById('log-filter');
  if (search) {
    let timer = null;
    search.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const q = (search.value || '').toLowerCase().trim();
        document.querySelectorAll('.logs-panel tbody tr').forEach(tr => {
          const text = tr.textContent.toLowerCase();
          tr.style.display = q ? (text.includes(q) ? '' : 'none') : '';
        });
      }, 200);
    });
  }
});
