/* אימון יוצר · הקיק: מניפה שנפתחת בגלילה, קלפים שעונים לעכבר, מסלול השלבים, תנועה עדינה בפתיחה,
   התמונה באודות שנוחתת כמו קלף, וההמלצות שמתחלקות כשמגיעים אליהן.
   הכל נגזר ממיקום הגלילה בלי שום הצמדה; קורא מידות רק כשהן משתנות, וכותב רק translate ו-rotate.
   בתנועה מופחתת, או בעצירת אנימציות מסרגל הנגישות, הכל במצב הסופי. */
(function () {
  "use strict";
  var html = document.documentElement;
  var hero = document.querySelector(".hero"), moves = document.querySelector(".moves"), deal = document.querySelector(".deal");
  var cards = Array.prototype.slice.call(deal.querySelectorAll(".mcard"));
  var steps = document.querySelector(".steps"), route = steps.querySelector(".route"), row = steps.querySelector(".step-row");
  var stepEls = Array.prototype.slice.call(steps.querySelectorAll(".step"));
  var loopNums = Array.prototype.slice.call(steps.querySelectorAll(".loop u i"));
  var photo = document.querySelector(".about-ph");
  var quotes = Array.prototype.slice.call(document.querySelectorAll(".q"));
  var narrow = matchMedia("(max-width:640px)");
  var round = matchMedia("(min-width:1024px)");
  var wide = matchMedia("(min-width:1181px)");
  var mouse = matchMedia("(hover:hover) and (pointer:fine)");
  var EASE = 0.15, LIT = [0, 1 / 3, 2 / 3], LIT_ROUND = [0.25, 0.5, 0.75];

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smooth(v) { return v * v * (3 - 2 * v); }
  function still() { return !html.classList.contains("anim") || html.classList.contains("a11y-still"); }
  // the page position, untouched by the card transforms
  function docTop(el) { var t = 0; while (el) { t += el.offsetTop; el = el.offsetParent; } return t; }

  var m = { vh: 0, moves: 0, cards: [], row: 0, rowH: 0, photo: 0 };
  function measure() {
    m.vh = window.innerHeight;
    m.moves = docTop(moves);
    m.photo = docTop(photo);
    m.cards = cards.map(docTop);
    m.row = docTop(row);
    m.rowH = row.offsetHeight;
  }

  // current and target for everything that eases
  var s = { y: 0, p: 1, mx: 0, r: 1, l: 1, q: cards.map(function () { return 1; }) };
  var t = { y: 0, p: 1, mx: 0, r: 1, l: 1, q: cards.map(function () { return 1; }) };
  var pointer = null;

  function targets() {
    var y = window.scrollY, vh = m.vh;
    t.y = y < vh * 1.2 ? y : t.y;
    if (still()) { t.p = 1; t.r = 1; t.l = 1; t.mx = 0; t.y = 0; t.q = t.q.map(function () { return 1; }); return; }
    t.p = wide.matches ? smooth(clamp(y / Math.max(1, m.moves - vh * 0.3))) : 1;
    t.l = smooth(clamp((vh * 0.98 - (m.photo - y)) / (vh * 0.46)));
    t.q = wide.matches ? t.q.map(function () { return 1; }) : m.cards.map(function (top) { return smooth(clamp((vh * 0.98 - (top - y)) / (vh * 0.34))); });
    t.r = round.matches
      ? clamp((vh * 0.72 - (m.row - y)) / Math.max(m.rowH * 0.8, vh * 0.42))
      : clamp((vh * 0.84 - (m.row - y)) / Math.max(m.rowH, vh * 0.42));
    t.mx = pointer === null ? 0 : pointer;
  }

  function near(a, b) { return Math.abs(a - b) < 0.0008; }
  function write() {
    hero.style.setProperty("--y", s.y.toFixed(1));
    deal.style.setProperty("--p", s.p.toFixed(4));
    deal.style.setProperty("--mx", s.mx.toFixed(4));
    steps.style.setProperty("--r", s.r.toFixed(4));
    photo.style.setProperty("--l", s.l.toFixed(4));
    cards.forEach(function (c, i) { c.style.setProperty("--q", s.q[i].toFixed(4)); });
    var lit = round.matches ? LIT_ROUND : LIT;
    var reached = 0;
    stepEls.forEach(function (el, i) {
      var on = still() || s.r >= lit[i] + 0.01;
      el.classList.toggle("lit", on);
      if (on) reached = i;
    });
    loopNums.forEach(function (n, i) { n.classList.toggle("now", i === reached); });
  }

  var raf = 0;
  function frame() {
    raf = 0;
    targets();
    var busy = false;
    ["p", "mx", "r", "l"].forEach(function (k) {
      if (near(s[k], t[k])) s[k] = t[k]; else { s[k] += (t[k] - s[k]) * EASE; busy = true; }
    });
    if (Math.abs(s.y - t.y) < 0.2) s.y = t.y; else { s.y += (t.y - s.y) * EASE; busy = true; }
    s.q = s.q.map(function (v, i) {
      if (near(v, t.q[i])) return t.q[i];
      busy = true;
      return v + (t.q[i] - v) * EASE;
    });
    write();
    if (busy) kick();
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }

  // the first paint lands exactly where the page is, with no fly-in on a reload halfway down
  function jump() {
    measure(); targets();
    s.y = t.y; s.p = t.p; s.mx = t.mx; s.r = t.r; s.l = t.l; s.q = t.q.slice();
    write();
  }

  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", function () { measure(); kick(); }, { passive: true });
  window.addEventListener("load", function () { measure(); kick(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); kick(); });
  if ("ResizeObserver" in window) new ResizeObserver(function () { measure(); kick(); }).observe(document.body);
  // the testimonials wait as a closed stack and deal out once you reach them, one time only. A card already on screen at load stays in place
  function dealQuotes(list) { list.forEach(function (c) { c.classList.remove("armed"); if (qio) qio.unobserve(c); }); }
  var qio = null;
  if (!still() && "IntersectionObserver" in window) {
    var reach = narrow.matches ? 0.15 : 0.32;
    qio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) dealQuotes(narrow.matches ? [e.target] : quotes); });
    }, { rootMargin: "0px 0px -" + reach * 100 + "% 0px" });
    quotes.forEach(function (c) {
      if (c.getBoundingClientRect().top > window.innerHeight * (1 - reach)) { c.classList.add("armed"); qio.observe(c); }
    });
  }

  // the accessibility bar can stop motion at any moment
  new MutationObserver(function () { if (still()) dealQuotes(quotes); kick(); }).observe(html, { attributes: true, attributeFilter: ["class"] });

  // the mouse: the whole fan leans a little toward it, the card under it lifts, its neighbours make room
  function nudge(active) {
    cards.forEach(function (c, i) {
      var d = active < 0 || i === active ? 0 : (i < active ? 1 : -1) * 18 / Math.abs(i - active);
      c.style.setProperty("--n", d);
    });
  }
  if (mouse.matches) {
    deal.addEventListener("pointermove", function (e) {
      if (!wide.matches || still()) return;
      var r = deal.getBoundingClientRect();
      pointer = ((e.clientX - r.left) / r.width - 0.5) * 2;
      kick();
    }, { passive: true });
    deal.addEventListener("pointerover", function (e) {
      if (!wide.matches || still()) return;
      nudge(cards.indexOf(e.target.closest(".mcard")));
    });
    deal.addEventListener("pointerleave", function () { pointer = null; nudge(-1); kick(); });
  }

  jump();
})();
