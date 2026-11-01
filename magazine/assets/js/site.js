/* אימון יוצר · סקיצה 2 "מגזין מהודק": הדר שנעלם בגלילה למטה וחוזר למעלה, reveal, תפריט טלפון. בלי ספריות ובלי הצמדה. */
(function () {
  "use strict";
  var html = document.documentElement;
  var hd = document.getElementById("hd");

  // header: soft shadow after the first scroll, away while scrolling down, back on the way up
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
