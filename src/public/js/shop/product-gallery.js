// public/js/shop/product-gallery.js
(function () {
  const windowEl = document.querySelector('.product-images-window');
  const scroller = windowEl?.querySelector('.pg-thumbs');
  if (!windowEl || !scroller) return;

  const supportsHover = window.matchMedia('(hover: hover)').matches;

  function selectThumb(btn) {
    scroller.querySelectorAll('.pg-thumb').forEach(el => {
      el.classList.remove('is-selected');
      el.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('is-selected');
    btn.setAttribute('aria-selected', 'true');
  }

  const thumbs = Array.from(scroller.querySelectorAll('.pg-thumb'));
  if (!thumbs.length) return;

  // Ensure something is selected
  const initiallySelected = scroller.querySelector('.pg-thumb.is-selected');
  if (!initiallySelected) {
    selectThumb(thumbs[0]);
  }

  // Click = select
  scroller.addEventListener('click', (e) => {
    const btn = e.target.closest('.pg-thumb');
    if (!btn) return;
    selectThumb(btn);
  });

  // Hover = select (so previous selected shrinks)
  if (supportsHover) {
    scroller.addEventListener('mouseover', (e) => {
      const btn = e.target.closest('.pg-thumb');
      if (!btn) return;
      selectThumb(btn);
    });
  }

  // Keyboard arrows = move selection
  scroller.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;

    const active = document.activeElement.closest('.pg-thumb');
    let idx = thumbs.indexOf(active);
    if (idx === -1) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      idx = Math.min(idx + 1, thumbs.length - 1);
      const next = thumbs[idx];
      next.focus();
      selectThumb(next);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      idx = Math.max(idx - 1, 0);
      const prev = thumbs[idx];
      prev.focus();
      selectThumb(prev);
    }
  });
})();
