(function () {
  document.querySelectorAll('[data-hscroll] .hscroll__track').forEach((track) => {
    let isDown = false;
    let startX = 0;
    let startLeft = 0;
    let dragDist = 0;
    const DRAG_THRESHOLD = 10; // px

    // Mouse down starts possible drag
    track.addEventListener('mousedown', (e) => {
      // Only left-click and only on mouse (ignore touchpads emulating mousedown)
      if (e.button !== 0) return;
      isDown = true;
      dragDist = 0;
      startX = e.clientX;
      startLeft = track.scrollLeft;
      track.classList.add('is-dragging');
      // Avoid text selection while dragging
      document.documentElement.style.userSelect = 'none';
    });

    // Move scrolls horizontally if mouse is down
    track.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      dragDist = Math.max(dragDist, Math.abs(dx));
      track.scrollLeft = startLeft - dx;
      e.preventDefault(); // prevent selecting images/text while dragging
    });

    // Mouse up ends drag
    const endDrag = () => {
      if (!isDown) return;
      isDown = false;
      track.classList.remove('is-dragging');
      document.documentElement.style.userSelect = '';
      // do nothing else; we'll decide on click whether to suppress
    };
    track.addEventListener('mouseleave', endDrag);
    track.addEventListener('mouseup', endDrag);

    // Suppress click ONLY if we actually dragged far enough
    track.addEventListener('click', (e) => {
      if (dragDist <= DRAG_THRESHOLD) return; // treat as a real click
      // If it was a drag, block the click on links inside the track
      const a = e.target.closest('a');
      if (a) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  });
})();


(function () {
  const AUTOPLAY_MS = 4000;          // time between auto-advances
  const ENABLE_AUTOPLAY = true;       // toggle autoplay
  const PAUSE_ON_HOVER = true;        // pause when user hovers
  const PAUSE_ON_FOCUS = true;        // pause when track focused
  const RESPECT_REDUCED_MOTION = true;

  document.querySelectorAll('[data-hscroll]').forEach((wrap) => {
    const track = wrap.querySelector('.hscroll__track');
    const prev = wrap.querySelector('[data-hscroll-prev]');
    const next = wrap.querySelector('[data-hscroll-next]');
    console.log(track, prev, next);
    if (!track || !prev || !next) return;

    // Make track keyboard-focusable for arrow keys
    if (!track.hasAttribute('tabindex')) track.setAttribute('tabindex', '0');

    const pageAmount = () => track.clientWidth; // 4/3/2/1 items per view
    const maxX = () => track.scrollWidth - track.clientWidth;

    const updateButtons = () => {
      const x = track.scrollLeft;
      prev.disabled = x <= 2;
      next.disabled = x >= maxX() - 2;
    };

    // ---- Paging with wrap ----
    const page = (dir) => {
      const amount = pageAmount();
      const x = track.scrollLeft;
      const end = maxX();

      if (dir > 0 && x >= end - 2) {
        // wrap to start
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else if (dir < 0 && x <= 2) {
        // wrap to end
        track.scrollTo({ left: end, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: dir * amount, behavior: 'smooth' });
      }
    };

    prev.addEventListener('click', () => page(-1));
    next.addEventListener('click', () => page(1));

    // ---- Keyboard paging ----
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); page(1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); page(-1); }
      if (e.key === 'Home') { e.preventDefault(); track.scrollTo({ left: 0, behavior: 'smooth' }); }
      if (e.key === 'End') { e.preventDefault(); track.scrollTo({ left: maxX(), behavior: 'smooth' }); }
    });

    // ---- Button state on scroll/resize ----
    const rafUpdate = () => {
      if (track._raf) cancelAnimationFrame(track._raf);
      track._raf = requestAnimationFrame(updateButtons);
    };
    track.addEventListener('scroll', rafUpdate);
    window.addEventListener('resize', updateButtons);
    updateButtons();

    // ---- Autoplay with pause/resume ----
    let timer = null;
    const prefersReduced = RESPECT_REDUCED_MOTION &&
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const startAutoplay = () => {
      if (!ENABLE_AUTOPLAY || prefersReduced) return;
      stopAutoplay();
      timer = setInterval(() => page(1), AUTOPLAY_MS);
    };
    const stopAutoplay = () => {
      if (timer) { clearInterval(timer); timer = null; }
    };

    // Pause on hover/focus (optional)
    if (PAUSE_ON_HOVER) {
      wrap.addEventListener('mouseenter', stopAutoplay);
      wrap.addEventListener('mouseleave', startAutoplay);
    }
    if (PAUSE_ON_FOCUS) {
      track.addEventListener('focusin', stopAutoplay);
      track.addEventListener('focusout', startAutoplay);
    }

    // Pause when tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAutoplay(); else startAutoplay();
    });

    // Start it up
    startAutoplay();
  });
})();