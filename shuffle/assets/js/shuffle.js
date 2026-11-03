/* אימון יוצר · "הטריפה": חפיסה של 13 קלפים שנטרפת בגרירה, בלחיצה, בכפתור ובגלילה; קלפים ענקיים שמסתובבים כשעוברים לידם.
   הכל נגזר ממספר אחד (כמה טריפות עברו) וממיקום הגלילה, בלי שום הצמדה; קורא מידות רק כשהן משתנות, וכותב רק transform.
   בתנועה מופחתת, או בעצירת אנימציות מסרגל הנגישות, הקלפים עומדים והכפתור מחליף קלף בלי תנועה. */
(function () {
  "use strict";
  var html = document.documentElement;
  var hero = document.querySelector(".hero"), deck = document.querySelector(".deck"), scene = document.querySelector(".scene");
  var shadow = document.querySelector(".deck-sh"), btn = document.querySelector(".shuffle");
  var dcs = Array.prototype.slice.call(deck.querySelectorAll(".dc"));
  var hand = document.querySelector(".hand");
  var wide = matchMedia("(min-width:1024px)");
  var phone = matchMedia("(max-width:640px)");
  var mouse = matchMedia("(hover:hover) and (pointer:fine)");
  var N = dcs.length, CUT = 5, DZ = 4, EASE = 0.14;

  // no deck is stacked perfectly: each card sits a touch off, so the edges show as a stack of colours
  var LOOSE = dcs.map(function (el, i) { return { x: ((i * 37) % 7 - 3) * 1.1, y: ((i * 53) % 7 - 3) * 0.9, r: ((i * 29) % 9 - 4) * 0.3 }; });

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smooth(v) { return v * v * (3 - 2 * v); }
  function mod(a, n) { return ((a % n) + n) % n; }
  function still() { return !html.classList.contains("anim") || html.classList.contains("a11y-still"); }
  function docTop(el) { var t = 0; while (el) { t += el.offsetTop; el = el.offsetParent; } return t; }

  var turns = Array.prototype.map.call(document.querySelectorAll("[data-turn]"), function (el, i) {
    return { el: el, stage: el.parentElement, off: +(el.getAttribute("data-off") || 0), soft: el.hasAttribute("data-soft"), sign: i % 2 ? -1 : 1, top: 0, h: 0,
      t: 0, s: 0, hx: 0, hy: 0, thx: 0, thy: 0 };
  });

  var m = { vh: 0, w: 0, h: 0, start: 0, span: 1, handTop: 0 };
  function measure() {
    m.vh = window.innerHeight;
    m.w = scene.offsetWidth; m.h = scene.offsetHeight;
    // one whole cut while the deck travels across the upper part of the screen, wherever the layout has put it
    m.start = Math.max(0, docTop(scene) + m.h * 0.5 - m.vh * 0.62);
    m.span = m.vh * 0.58;
    turns.forEach(function (o) { o.top = docTop(o.stage); o.h = o.stage.offsetHeight; });
    m.handTop = hand ? docTop(hand) : 0;
  }

  /* ---------- the deck: phi counts the cuts. Its whole part says who is on top, its fraction how far this cut has come ---------- */
  var phi = { shown: NaN, clicks: 0, drag: 0, sc: 0, tsc: 0 };
  var tween = null;
  var tilt = { x: 0, y: 0, tx: 0, ty: 0 };

  function place(p) {
    var k = Math.floor(p), r = p - k, spl = 0;
    dcs.forEach(function (el, c) {
      var a = mod(c + CUT * k, N), b = mod(c + CUT * (k + 1), N);
      var upper = a < N - CUT;                                 // the upper part goes under, the lower part comes over the top
      var ri = clamp((r - (a / N) * 0.14) / 0.86);             // the cards of a pile follow one another a little, so they riffle
      var s = Math.sin(Math.PI * smooth(ri));
      spl = Math.max(spl, s);
      var za = (N - 1 - a) * DZ, zb = (N - 1 - b) * DZ;
      var z = za + (zb - za) * smooth(clamp((ri - 0.28) / 0.44));
      // both piles stay on the screen and off the headline; on a phone the deck sits by the edge, so the cut opens towards the middle
      var reach = wide.matches ? (upper ? 0.2 : -0.27) : phone.matches ? (upper ? 0.08 : -0.5) : (upper ? 0.26 : -0.34);
      var rel = upper ? a - (N - CUT - 1) / 2 : a - (N - CUT) - (CUT - 1) / 2;     // its place inside its pile: the pile opens a little
      var x = m.w * reach * s + rel * 2.4 * s;
      var y = -m.h * 0.035 * s + rel * 1.2 * s;
      var rot = (upper ? 8 : -9) * s + rel * 0.9 * s;
      var L = LOOSE[c];
      el.style.transform = "translate3d(" + (x + L.x).toFixed(1) + "px," + (y + L.y).toFixed(1) + "px," + z.toFixed(1) + "px) rotate(" + (rot + L.r).toFixed(2) + "deg)";
    });
    shadow.style.setProperty("--spl", spl.toFixed(3));
  }

  function run(to, dur) {
    if (still()) { phi.clicks = to; tween = null; kick(); return; }
    tween = { from: phi.clicks, to: to, at: performance.now(), dur: dur };
    kick();
  }
  function cut(dir) { run(Math.round(tween ? tween.to : phi.clicks) + dir, 1050); }
  btn.addEventListener("click", function () { cut(1); });

  // drag: the deck follows the hand, and settles on the nearest cut, in the direction it was going
  var held = null;
  deck.addEventListener("pointerdown", function (e) {
    if (e.button) return;
    held = { x: e.clientX, id: e.pointerId, moved: false };
    tween = null;
    deck.setPointerCapture(e.pointerId);
    deck.classList.add("held");
  });
  deck.addEventListener("pointermove", function (e) {
    if (!held || e.pointerId !== held.id) return;
    var dx = e.clientX - held.x;
    if (Math.abs(dx) > 5) held.moved = true;
    if (held.moved && !still()) { phi.drag = -dx / (m.w * 1.5); kick(); }
  });
  function drop(e, cancelled) {
    if (!held || e.pointerId !== held.id) return;
    var moved = held.moved, d = phi.drag;
    held = null; deck.classList.remove("held");
    phi.clicks += d; phi.drag = 0;
    if (cancelled) { run(Math.round(phi.clicks), 500); return; }
    if (!moved) { cut(1); return; }
    run(Math.abs(d) < 0.08 ? Math.round(phi.clicks) : (d > 0 ? Math.ceil(phi.clicks) : Math.floor(phi.clicks)), 620);
  }
  deck.addEventListener("pointerup", function (e) { drop(e, false); });
  deck.addEventListener("pointercancel", function (e) { drop(e, true); });
  deck.addEventListener("dragstart", function (e) { e.preventDefault(); });

  // the mouse: anywhere over the opening the deck turns a little toward it, and the light moves with it
  if (mouse.matches) {
    hero.addEventListener("pointermove", function (e) {
      if (still()) return;
      tilt.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      tilt.ty = (e.clientY / m.vh - 0.5) * 2;
      kick();
    }, { passive: true });
    hero.addEventListener("pointerleave", function () { tilt.tx = 0; tilt.ty = 0; kick(); });
    // the big cards answer the mouse too, a few degrees
    turns.forEach(function (o) {
      o.stage.addEventListener("pointermove", function (e) {
        if (still()) return;
        var r = o.stage.getBoundingClientRect();
        o.thx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        o.thy = ((e.clientY - r.top) / r.height - 0.5) * 2;
        kick();
      }, { passive: true });
      o.stage.addEventListener("pointerleave", function () { o.thx = 0; o.thy = 0; kick(); });
    });
  }

  /* ---------- the big cards: back to you as they come up, facing you by the middle of the screen, leaning a little as they leave ---------- */
  function turnTarget(o, y) {
    var c = o.top + o.h / 2 - y - m.vh * 0.52;
    return Math.max(-1, Math.min(1, c / (m.vh * 0.5 + o.h / 2))) + o.off * 0.05;
  }
  function writeTurn(o) {
    var d = o.s, sg = o.sign, ry, rz, up;
    if (d > 0) {
      var q = smooth(clamp((d - 0.22) / 0.6));
      // a photograph of a person only leans: his face is never seen from the side or flipped
      if (o.soft) { ry = -4 * sg - 13 * sg * q; rz = -1.5 * sg * q; up = 20 * q; }
      else { ry = -9 * sg - 171 * sg * q; rz = -5 * sg * q; up = 34 * q; }
    } else {
      ry = -9 * sg + d * -20 * sg; rz = d * -2.5 * sg; up = 0;
    }
    o.el.style.setProperty("--ry", (ry + o.hx * 9).toFixed(2) + "deg");
    o.el.style.setProperty("--rz", rz.toFixed(2) + "deg");
    o.el.style.setProperty("--hy", (o.hy * -6).toFixed(2) + "deg");
    o.el.style.setProperty("--up", up.toFixed(1) + "px");
    o.stage.style.setProperty("--cs", (0.28 + 0.72 * Math.abs(Math.cos(ry * Math.PI / 180))).toFixed(3));
  }

  var handF = { s: 1, t: 1 };
  function frame(now) {
    raf = 0;
    var y = window.scrollY, busy = false, calm = still();

    if (tween) {
      var v = clamp((now - tween.at) / tween.dur);
      phi.clicks = tween.from + (tween.to - tween.from) * smooth(v);
      if (v >= 1) { phi.clicks = tween.to; tween = null; } else busy = true;
    }
    phi.tsc = calm ? 0 : smooth(clamp((y - m.start) / m.span));
    if (Math.abs(phi.sc - phi.tsc) < 0.0008) phi.sc = phi.tsc; else { phi.sc += (phi.tsc - phi.sc) * EASE; busy = true; }
    var p = phi.clicks + phi.drag + phi.sc;
    if (Math.abs(p - phi.shown) > 0.0003 || isNaN(phi.shown)) { place(p); phi.shown = p; }

    if (calm) { tilt.tx = 0; tilt.ty = 0; }
    ["x", "y"].forEach(function (k) {
      var key = "t" + k;
      if (Math.abs(tilt[k] - tilt[key]) < 0.002) tilt[k] = tilt[key]; else { tilt[k] += (tilt[key] - tilt[k]) * 0.09; busy = true; }
    });
    deck.style.setProperty("--tx", tilt.x.toFixed(3));
    deck.style.setProperty("--ty", tilt.y.toFixed(3));

    turns.forEach(function (o) {
      if (calm) { o.t = 0; o.thx = 0; o.thy = 0; } else o.t = turnTarget(o, y);
      var near = Math.abs(o.s - o.t) < 0.0008 && Math.abs(o.hx - o.thx) < 0.002 && Math.abs(o.hy - o.thy) < 0.002;
      if (near) { if (o.s === o.t && o.hx === o.thx && o.hy === o.thy) return; o.s = o.t; o.hx = o.thx; o.hy = o.thy; }
      else { o.s += (o.t - o.s) * EASE; o.hx += (o.thx - o.hx) * 0.12; o.hy += (o.thy - o.hy) * 0.12; busy = true; }
      writeTurn(o);
    });

    if (hand) {
      handF.t = calm ? 1 : smooth(clamp((y + m.vh * 0.98 - m.handTop) / (m.vh * 0.42)));
      if (Math.abs(handF.s - handF.t) < 0.001) handF.s = handF.t; else { handF.s += (handF.t - handF.s) * EASE; busy = true; }
      hand.style.setProperty("--f", handF.s.toFixed(3));
    }
    if (busy) kick();
  }
  var raf = 0;
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }

  // the first paint lands where the page is
  function jump() {
    measure();
    var y = window.scrollY, calm = still();
    phi.tsc = phi.sc = calm ? 0 : smooth(clamp((y - m.start) / m.span));
    turns.forEach(function (o) { o.t = o.s = calm ? 0 : turnTarget(o, y); writeTurn(o); });
    handF.t = handF.s = calm ? 1 : smooth(clamp((y + m.vh * 0.98 - m.handTop) / (m.vh * 0.42)));
    if (hand) hand.style.setProperty("--f", handF.s.toFixed(3));
  }

  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", function () { measure(); phi.shown = NaN; kick(); }, { passive: true });
  window.addEventListener("load", function () { measure(); kick(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); kick(); });
  if ("ResizeObserver" in window) new ResizeObserver(function () { measure(); kick(); }).observe(document.body);
  // the accessibility bar can stop motion at any moment
  new MutationObserver(function () { tween = null; phi.clicks = Math.round(phi.clicks); phi.shown = NaN; kick(); }).observe(html, { attributes: true, attributeFilter: ["class"] });

  html.classList.add("deck-on");
  jump();
  // once, as the page opens: the deck shuffles by itself and lands with Almog on top
  if (!still() && window.scrollY < 40) {
    phi.clicks = -1;
    place(-1); phi.shown = -1;
    setTimeout(function () { tween = { from: -1, to: 0, at: performance.now(), dur: 1300 }; kick(); }, 520);
  } else {
    kick();
  }
})();
