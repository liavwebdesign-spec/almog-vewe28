/* אימון יוצר · סקיצה 3 "החפיסה": הדר שנעלם בגלילה למטה וחוזר למעלה, reveal, החפיסה בהירו, תפריט טלפון. בלי ספריות ובלי הצמדה. */
(function () {
  "use strict";
  var html = document.documentElement;
  var hd = document.getElementById("hd");

  // header: solid after the hero starts to scroll, away while scrolling down, back on the way up
  var lastY = window.scrollY, ticking = false, solid = null, away = null;
  function onScroll() {
    var y = window.scrollY;
    // hide or show only after a real move (12px), so slow or momentum scrolling never flips it back and forth
    var s = y > 24, d = y - lastY, a = away;
    if (y < 320) { a = false; lastY = y; }
    else if (Math.abs(d) > 12) { a = d > 0; lastY = y; }
    if (s !== solid) { hd.classList.toggle("solid", s); solid = s; }
    if (a !== away && !document.body.classList.contains("menu-open")) { hd.classList.toggle("away", a); away = a; }
    ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // reveal: groups stagger by their order inside the parent
  if ("IntersectionObserver" in window && html.classList.contains("anim")) {
    var els = document.querySelectorAll(".rv");
    els.forEach(function (el) {
      var sib = el.parentElement.querySelectorAll(":scope > .rv");
      el.style.setProperty("--k", Math.min(Array.prototype.indexOf.call(sib, el), 4));
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    // .io elements are never hidden; they only get .in (a line that draws, a marker that sweeps)
    var all = Array.prototype.slice.call(els).concat(Array.prototype.slice.call(document.querySelectorAll(".io")));
    all.forEach(function (el) {
      // what is already on screen at load shows at once (no blank first paint)
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) el.classList.add("in"); else io.observe(el);
    });
    html.classList.add("rv-on");
  }

  // the deck: "לטרוף מחדש" draws the next move card; the faces are read from the four move cards below
  var deck = document.querySelector("[data-deck]");
  if (deck) {
    var face = deck.querySelector("[data-face]"), draw = deck.querySelector(".draw"), said = deck.querySelector("[data-said]");
    var moves = Array.prototype.map.call(document.querySelectorAll(".mcard"), function (m) {
      return { id: m.id, cls: m.className.match(/s-[a-z]+/)[0], name: m.querySelector("h3").textContent,
        line: m.querySelector("p").textContent, art: m.querySelector(".m-art").innerHTML };
    });
    var cur = 0, order = [], busy = false;
    function next() {
      if (!order.length) { order = [0, 1, 2, 3].filter(function (i) { return i !== cur; }).sort(function () { return Math.random() - .5; }); }
      return order.shift();
    }
    function show(i) {
      var m = moves[i]; cur = i;
      face.className = "face " + m.cls; face.href = "#" + m.id;
      face.querySelector(".face-art").innerHTML = m.art;
      face.querySelector(".face-name").textContent = m.name;
      face.querySelector(".face-line").textContent = m.line;
      said.textContent = "נשלף: " + m.name;
    }
    var calm = !html.classList.contains("anim");
    draw.hidden = false;
    draw.addEventListener("click", function () {
      if (busy) return;
      var i = next();
      if (calm || html.classList.contains("a11y-still")) { show(i); return; }
      busy = true;
      deck.classList.add("riffle"); face.classList.add("out");
      setTimeout(function () {
        show(i); face.classList.remove("out"); face.classList.add("in");
        setTimeout(function () { deck.classList.remove("riffle"); face.classList.remove("in"); busy = false; }, 440);
      }, 220);
    });
  }

  // phone menu
  var burger = document.querySelector(".burger"), md = document.getElementById("md");
  function setMenu(open) {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "סגירת תפריט" : "פתיחת תפריט");
    md.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (open) { hd.classList.remove("away"); away = false; }
  }
  burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
  md.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !md.hidden) { setMenu(false); burger.focus(); } });

  var yr = document.querySelector("[data-year]"); if (yr) yr.textContent = new Date().getFullYear();
})();
