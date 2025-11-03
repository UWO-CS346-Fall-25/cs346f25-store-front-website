(function () {
  const container = document.querySelector('.pg-thumbs');
  if (!container) return;

  const supportsHover = window.matchMedia('(hover: hover)').matches;

  function selectThumb(btn, opts = {}) {
    const { scroll = false } = opts;

    container.querySelectorAll('.pg-thumb').forEach(el => {
      el.classList.remove('is-selected');
      el.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('is-selected');
    btn.setAttribute('aria-selected', 'true');

    if (scroll) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      btn.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }
  }

  // Click: select & scroll into view
  container.addEventListener('click', e => {
    const btn = e.target.closest('.pg-thumb');
    if (btn) selectThumb(btn, { scroll: true });
  });

  // Keyboard: left/right moves selection, scroll into view
  container.addEventListener('keydown', e => {
    const thumbs = Array.from(container.querySelectorAll('.pg-thumb'));
    if (!thumbs.length) return;

    const current = container.querySelector('.pg-thumb.is-selected') || thumbs[0];
    let idx = thumbs.indexOf(current);

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      idx = Math.min(idx + 1, thumbs.length - 1);
      thumbs[idx].focus();
      selectThumb(thumbs[idx], { scroll: true });
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      idx = Math.max(idx - 1, 0);
      thumbs[idx].focus();
      selectThumb(thumbs[idx], { scroll: true });
    }
  });

  // Hover: make it the selected one too (no auto-scroll to avoid jitter)
  if (supportsHover) {
    container.addEventListener('mouseenter', e => {
      const btn = e.target.closest('.pg-thumb');
      if (btn) selectThumb(btn, { scroll: false });
    }, true); // use capture so it fires when entering each child

    container.addEventListener('mouseover', e => {
      const btn = e.target.closest('.pg-thumb');
      if (btn) selectThumb(btn, { scroll: false });
    });
  }
})();
