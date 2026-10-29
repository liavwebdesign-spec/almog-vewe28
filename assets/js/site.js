/* אימון יוצר · behaviour: reveal (MV:h27), headroom and drawer (MV:hd3), the deck (the signature moment) */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = v => Math.max(0, Math.min(1, v));

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
  document.querySelectorAll('.hero, [data-rv]').forEach(enter);

  // headroom: hides on the way down, returns on the way up, holds while focus is inside.
  // away(): a zone where it stays hidden either way (the pinned deck, whose heading sits under it)
  function headroom(el, away) {
    let last = scrollY, raf = 0;
    const upd = () => {
      raf = 0;
      const y = scrollY, d = y - last, top = el.offsetHeight + 24;
      el.classList.toggle('is-scrolled', y > 8);
      if (y <= top || el.querySelector(':focus-visible')) { el.classList.remove('is-hidden'); last = y; return; }
      if (away()) { el.classList.add('is-hidden'); last = y; return; }
      // tolerance: a slow trackpad drift does not flicker it
      if (Math.abs(d) < 6) return;
      el.classList.toggle('is-hidden', d > 0);
      last = y;
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
    el.addEventListener('focusin', upd);
    upd();
  }
  const deckSec = document.getElementById('deck'), wideMQ = matchMedia('(min-width: 700px)');
  headroom(document.getElementById('hd'), () => {
    if (!deckSec || !wideMQ.matches) return false;
    const r = deckSec.getBoundingClientRect();
    return r.top <= 1 && r.bottom >= innerHeight - 1;
  });

  // the phone drawer: focus moves in and is trapped, Escape and the scrim close it, focus returns to the burger
  function drawer(root, burger) {
    const panel = root.querySelector('.md-panel'), scrim = root.querySelector('.md-scrim'), closeBtn = root.querySelector('.md-close');
    const doc = document.documentElement; let last = null;
    root.querySelectorAll('.md-item').forEach((el, i) => el.style.setProperty('--i', i));
    panel.inert = true;
    const set = open => {
      root.classList.toggle('open', open);
      panel.inert = !open;
      burger.setAttribute('aria-expanded', String(open));
      // lock the real scroller, <html>, and keep the scrollbar's space so nothing jumps
      doc.style.scrollbarGutter = open ? 'stable' : '';
      doc.style.overflow = open ? 'hidden' : '';
      if (open) { last = document.activeElement; setTimeout(() => closeBtn.focus(), 180); }
      else { const to = (last && last !== document.body) ? last : burger; to.focus({ preventScroll: true }); }
    };
    burger.addEventListener('click', () => set(!root.classList.contains('open')));
    closeBtn.addEventListener('click', () => set(false));
    scrim.addEventListener('click', () => set(false));
    root.querySelectorAll('a').forEach(a => a.addEventListener('click', () => set(false)));
    addEventListener('keydown', e => {
      if (!root.classList.contains('open')) return;
      if (e.key === 'Escape') { set(false); return; }
      if (e.key !== 'Tab') return;
      const f = [...panel.querySelectorAll('a,button')].filter(x => x.offsetParent !== null);
      const i = f.indexOf(document.activeElement);
      const n = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i === f.length - 1 ? 0 : i + 1);
      e.preventDefault(); f[n].focus();
    });
  }
  drawer(document.getElementById('md'), document.querySelector('.burger'));

  // the deck: four backs stacked on the table are dealt to their places and turned over by the reader's scroll.
  // Desktop: the section is pinned and its own scroll drives the deal. Phone: no pin, a 2x2 table dealt as it passes.
  const sec = document.getElementById('deck'), table = document.getElementById('table'), stage = document.getElementById('stage');
  // pages without the deck (404, inner pages) still get the year below
  if (stage) deck();
  function deck() {
    const cards = [...stage.querySelectorAll('.card')], caps = [...table.querySelectorAll('.cap')];
    const rest = [[-7, 6, 0], [-2, 2, -3], [3, -1, 2], [8, -4, 5]];   // rotate, x, y of each card in the stack
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const narrowMQ = matchMedia('(max-width: 699px)');
    let slots = [], w = 220, narrow = false;
    const layout = () => {
      narrow = narrowMQ.matches;
      const gap = narrow ? 14 : 28;
      stage.style.height = '';
      const W = stage.clientWidth;
      if (narrow) { w = Math.min((W - gap) / 2, 190); stage.style.height = 2 * w * 1.4 + gap + 'px'; }
      else w = Math.min((W - 3 * gap) / 4, stage.clientHeight * .96 * 5 / 7, 300);
      // --w on the table, so the caption columns below sit exactly under the card slots
      table.style.setProperty('--w', w + 'px');
      const h = w * 7 / 5;
      slots = cards.map((c, i) => narrow
        ? { x: (i % 2 ? -1 : 1) * (w + gap) / 2, y: (i < 2 ? -1 : 1) * (h + gap) / 2 }
        : { x: (1.5 - i) * (w + gap), y: 0 });
      if (narrow) caps.forEach(c => { c.style.opacity = ''; c.style.transform = ''; });
    };
    const draw = p => {
      cards.forEach((c, i) => {
        const d = ease(clamp((p - .08 - i * .07) / .32));
        const f = ease(clamp((p - .5 - i * .08) / .2));
        const r = rest[i], s = slots[i];
        const x = r[1] + (s.x - r[1]) * d, y = r[2] + (s.y - r[2]) * d - Math.sin(Math.PI * d) * w * .18;
        const rz = r[0] * (1 - d), ry = 180 * (1 - f), lift = Math.sin(Math.PI * f) * 40;
        c.style.transform = `translate3d(${x}px,${y}px,${lift}px) rotateZ(${rz}deg) rotateY(${ry}deg)`;
        c.style.zIndex = d > .02 ? 10 + i : 4 - i;
        c.classList.toggle('is-up', f > .98);
        // desktop: each caption arrives with its own card
        if (!narrow) { caps[i].style.opacity = f; caps[i].style.transform = `translateY(${(1 - f) * 16}px)`; }
      });
    };
    // "stop animations" in the toolbar: the deck lies dealt and face up, like reduced motion
    let still = document.documentElement.classList.contains('a11y-still');
    document.addEventListener('a11y:still', e => { still = e.detail; tick(); });
    const tick = () => {
      if (reduce || still) return draw(1);
      if (narrow) { const r = stage.getBoundingClientRect(); return draw(clamp((innerHeight * .95 - r.top) / (innerHeight * .8))); }
      const r = sec.getBoundingClientRect(), total = sec.offsetHeight - innerHeight;
      draw(clamp(-r.top / total));
    };
    // while the deck is pinned its arrows move with the window, not the page: snap them again once the scroll settles
    let raf = 0, settle = 0;
    addEventListener('scroll', () => {
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; tick(); });
      if (!narrow) { clearTimeout(settle); settle = setTimeout(() => window.snapIcons && window.snapIcons(sec), 150); }
    }, { passive: true });
    addEventListener('resize', () => { layout(); tick(); });
    layout(); tick();
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
