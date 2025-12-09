
(() => {
  const hero = document.querySelector('.hero .hero__stage');
  if (!hero) return;

  const frame = hero.querySelector('.hero__frame');
  const imgEl = frame?.querySelector('img');
  const indicators = [...hero.querySelectorAll('.carousel__indicator')];
  if (!frame || !imgEl || indicators.length === 0) return;

  // interval from CSS var
  const cssInterval = getComputedStyle(document.documentElement)
    .getPropertyValue('--carousel-interval').trim() || '5000ms';
  const INTERVAL = Number(cssInterval.replace('ms', '')) || 5000;

  // Slides from data-*
  const slides = indicators.map(btn => ({
    src: btn.dataset.src,
    alt: btn.dataset.alt || 'Featured image',
    href: btn.dataset.href || '',
    caption: btn.dataset.caption || ''
  })).filter(s => s.src);

  let index = 0;
  let timerId = null;
  let paused = false;
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function setBar(bar, { width = 0, animate = false, duration = INTERVAL, paused = false }) {
    if (!bar) return;
    bar.style.animation = 'none';
    bar.style.width = width + '%';
    if (animate) {
      // force reflow to restart animation

      bar.offsetWidth;
      bar.style.animation = `carousel-progress ${duration}ms linear forwards`;
      bar.style.animationPlayState = paused ? 'paused' : 'running';
    }
  }

  function render(i) {
    const was = index;
    index = (i + slides.length) % slides.length;
    const wrapped = (was === slides.length - 1 && index === 0); // last -> first

    const s = slides[index];
    if (!s) return;

    if (imgEl.getAttribute('src') !== s.src) imgEl.src = s.src;
    imgEl.alt = s.alt;

    indicators.forEach((btn, j) => {
      const active = j === index;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');

      const bar = btn.querySelector('.carousel__indicator-bar');

      if (wrapped) {
        // New cycle: clear all then animate first
        setBar(bar, { width: active ? 0 : 0, animate: false });
        if (active && !paused && !prefersReduced) {
          setBar(bar, { width: 0, animate: true, duration: INTERVAL, paused });
        }
        return;
      }

      if (j < index) {
        // Previous slides stay filled
        setBar(bar, { width: 100, animate: false });
      } else if (active) {
        // Current slide animates
        if (!paused && !prefersReduced) {
          setBar(bar, { width: 0, animate: true, duration: INTERVAL, paused });
        } else {
          setBar(bar, { width: 0, animate: false });
        }
      } else {
        // Future slides are empty
        setBar(bar, { width: 0, animate: false });
      }
    });

  }

  // --- scheduling with drift correction ---
  let nextDue = 0; // timestamp when next slide should fire

  function clearLoop() {
    if (timerId) clearTimeout(timerId);
    timerId = null;
  }

  function scheduleNext(now = performance.now()) {
    clearLoop();
    // keep the cadence steady even if the tab hiccups:
    if (nextDue <= now) nextDue = now + INTERVAL;     // first time or catch-up
    const delay = Math.max(0, nextDue - now);
    timerId = setTimeout(tick, delay);
  }

  function tick() {
    // move to next slide and set the nextDue exactly one interval later
    render(index + 1);
    nextDue += INTERVAL;
    if (!paused && !prefersReduced) scheduleNext(performance.now());
  }

  function startLoop() {
    if (prefersReduced) return;  // respect reduced motion
    nextDue = performance.now() + INTERVAL;
    scheduleNext();
  }

  function stopLoop() {
    clearLoop();
  }

  // --- interactions ---
  // indicator clicks
  indicators.forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.slide);
      render(Number.isFinite(i) ? i : 0);
      // reset cadence so bar & timer stay in sync
      startLoop();
    });
  });

  // pause on hover/focus
  // hero.addEventListener('mouseenter', () => { paused = true; stopLoop(); syncBarsPaused(); });
  // hero.addEventListener('mouseleave', () => { paused = false; startLoop(); });
  // hero.addEventListener('focusin', () => { paused = true; stopLoop(); syncBarsPaused(); });
  // hero.addEventListener('focusout', () => { paused = false; startLoop(); });

  function syncBarsPaused() {
    // freeze the active bar
    const active = hero.querySelector('.carousel__indicator.is-active .carousel__indicator-bar');
    if (active) active.style.animationPlayState = 'paused';
  }

  // keyboard
  hero.tabIndex = 0;
  hero.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); render(index + 1); startLoop(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); render(index - 1); startLoop(); }
  });

  // swipe
  let startX = 0, dx = 0, dragging = false, pid = null;
  frame.addEventListener('pointerdown', (e) => {
    dragging = true; pid = e.pointerId; startX = e.clientX; dx = 0;
    frame.setPointerCapture(pid);
    paused = true; stopLoop(); syncBarsPaused();
  });
  frame.addEventListener('pointermove', (e) => { if (dragging) dx = e.clientX - startX; });
  frame.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    if (Math.abs(dx) > 40) render(dx < 0 ? index + 1 : index - 1);
    dx = 0; pid = null;
    paused = false; startLoop();
  });
  frame.addEventListener('pointercancel', () => { dragging = false; dx = 0; pid = null; paused = false; startLoop(); });

  // pause when tab hidden (prevents huge catch-up delays)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopLoop(); }
    else { startLoop(); }
  });

  // optional: click image navigates to product
  frame.style.cursor = 'pointer';
  frame.addEventListener('click', () => {
    const href = slides[index]?.href;
    if (href) window.location.assign(href);
  });

  // init
  render(0);
  startLoop();
})();