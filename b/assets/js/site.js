/* אימון יוצר · גרסה B · behaviour: reveal, headroom and the capsule menu (MV:hd8), the service cards that light up (s09 steps) */
(() => {
  // in view = fire. Measured directly on scroll and resize, not through IntersectionObserver:
  // an observer does not update while the tab is throttled, and an entrance that never fires leaves a section invisible.
  function inView(el, f) {
    let ro;
    const chk = () => { const r = el.getBoundingClientRect(); if (r.top < innerHeight * .9 && r.bottom > 0) { off(); f(); } };
    const off = () => { removeEventListener('scroll', chk); removeEventListener('resize', chk); if (ro) ro.disconnect(); };
    addEventListener('scroll', chk, { passive: true }); addEventListener('resize', chk);
    // a layout change with no scroll (a font swaps in) can also bring it into view
    if (window.ResizeObserver) { ro = new ResizeObserver(chk); ro.observe(document.body); }
    requestAnimationFrame(chk); setTimeout(chk, 300);
  }
  function enter(root) {
    const els = root.querySelectorAll('.rv');
    els.forEach((el, i) => { if (!el.style.getPropertyValue('--i')) el.style.setProperty('--i', i); });
    // a script that ran late, after the 2.5s CSS failsafe already showed it: keep it shown, no second entrance
    if (els.length && getComputedStyle(els[0]).opacity === '1') root.classList.add('is-in');
    root.classList.add('rv-on');
    inView(root, () => root.classList.add('is-in'));
  }
  document.querySelectorAll('[data-rv]').forEach(enter);

  // headroom (hd8): hides on the way down, returns on the way up, holds while the menu is open or focus is inside
  function headroom(el) {
    let last = scrollY, raf = 0;
    const upd = () => {
      raf = 0;
      const y = scrollY, d = y - last, top = el.offsetHeight + 24;
      el.classList.toggle('is-scrolled', y > 8);
      const hold = el.classList.contains('menu-open') || !!el.querySelector(':focus-visible');
      if (y <= top || hold) { el.classList.remove('is-hidden'); last = y; return; }
      // tolerance: a slow trackpad drift does not flicker it
      if (Math.abs(d) < 6) return;
      el.classList.toggle('is-hidden', d > 0);
      last = y;
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
    el.addEventListener('focusin', upd);
    upd();
  }

  // the capsule menu (hd8)
  const hd = document.getElementById('hd');
  if (hd) {
    const t = hd.querySelector('.h8-toggle'), label = t.querySelector('span'), panel = document.getElementById('h8p');
    const links = [...panel.querySelectorAll('a')];
    panel.querySelectorAll('.h8-links a').forEach((a, i) => a.style.setProperty('--i', i));
    headroom(hd);
    const set = (open, kb) => {
      hd.classList.toggle('menu-open', open); t.setAttribute('aria-expanded', String(open));
      label.textContent = open ? 'סגירה' : 'תפריט'; panel.inert = !open;
      // focus moves into the card only when it was opened from the keyboard; a mouse user keeps their place
      if (open && kb) setTimeout(() => links[0].focus({ preventScroll: true }), 120);
    };
    set(false);
    t.addEventListener('click', e => set(!hd.classList.contains('menu-open'), e.detail === 0));
    links.forEach(a => a.addEventListener('click', () => set(false)));
    document.addEventListener('click', e => { if (!hd.contains(e.target)) set(false); });
    hd.addEventListener('keydown', e => { if (e.key === 'Escape' && hd.classList.contains('menu-open')) { set(false); t.focus(); } });
    // Tab past the last link: the card closes instead of staying open over the page
    let tab = false;
    hd.addEventListener('keydown', e => { if (e.key === 'Tab') { tab = true; setTimeout(() => { tab = false; }, 0); } });
    hd.addEventListener('focusout', e => {
      if (!hd.classList.contains('menu-open')) return;
      const to = e.relatedTarget;
      if (to ? !hd.contains(to) && !to.contains(hd) : tab) set(false);
    });
  }

  // the signature: the service card nearest the middle of the screen lights up in its colour, and the photo,
  // the small card and the big number beside the list follow it (on a phone only the card, the rest is hidden)
  const steps = document.querySelector('.steps');
  if (steps) {
    const lists = [steps.querySelectorAll('.step'), steps.querySelectorAll('.sv-img'), steps.querySelectorAll('.mc'), document.querySelectorAll('.sig-n span')].map(l => [...l]);
    let on = 0, raf = 0;
    const setOn = i => {
      if (i === on) return;
      lists.forEach(L => { if (L[on]) L[on].classList.remove('is-on'); if (L[i]) L[i].classList.add('is-on'); });
      on = i;
    };
    const measure = () => {
      raf = 0;
      const r = steps.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      const mid = innerHeight * .5; let best = 0, bd = 1e9;
      lists[0].forEach((el, i) => { const b = el.getBoundingClientRect(), d = Math.abs(b.top + b.height / 2 - mid); if (d < bd) { bd = d; best = i; } });
      setOn(best);
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(measure); }, { passive: true });
    addEventListener('resize', measure);
    measure();
  }

  document.querySelectorAll('[data-year]').forEach(e => { e.textContent = new Date().getFullYear(); });
})();

/* snap-icons: every inline SVG icon on a whole device pixel. Paste into the site script (design-dna/tools/icons, 1.10.2026).
   An icon that lands on y=826.42 is drawn across two pixel rows and looks soft at 100% zoom. Page coordinates, so a
   fraction of the scroll position never leaks in; the translate property, so hover transforms stay free. Re-runs on
   load, fonts, resize, any layout change (lazy images, tabs, text scaled by the a11y toolbar) and every finished entrance. */
(function () {
  var SEL = "svg.ic, svg.arr", t = 0;
  function snap(scope) {
    var dpr = window.devicePixelRatio || 1;
    (scope || document).querySelectorAll(SEL).forEach(function (el) {
      el.style.translate = "";
      var r = el.getBoundingClientRect(); if (!r.width) return;
      var fixed = false; for (var q = el; q && q !== document.body; q = q.parentElement) if (getComputedStyle(q).position === "fixed") { fixed = true; break; }
      var x = r.left + (fixed ? 0 : scrollX), y = r.top + (fixed ? 0 : scrollY);
      var dx = Math.round(x * dpr) / dpr - x, dy = Math.round(y * dpr) / dpr - y;
      if (Math.abs(dx) > .01 || Math.abs(dy) > .01) el.style.translate = dx.toFixed(3) + "px " + dy.toFixed(3) + "px";
    });
  }
  function soon() { clearTimeout(t); t = setTimeout(function () { snap(); }, 120); }
  window.snapIcons = snap;
  addEventListener("load", soon); addEventListener("resize", soon);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(soon);
  if (window.ResizeObserver) new ResizeObserver(soon).observe(document.body);
  document.addEventListener("load", function (e) { if (e.target.tagName === "IMG") soon(); }, true);
  document.addEventListener("animationend", function (e) { if (e.target.querySelector) snap(e.target); });
  document.addEventListener("transitionend", function (e) { if (/translate|transform/.test(e.propertyName) && e.target.querySelector) snap(e.target); });
})();
