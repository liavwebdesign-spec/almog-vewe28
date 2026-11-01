/* אימון יוצר · השילוב, הגרסה הבהירה: רשת הקורים מסקיצות הלוגו של אלמוג (עמוד 5, הרשת סביב העיגול).
   נקודות כתומות שמחוברות בקווים דקים כמעט שקופים: סביב התמונה בפתיחה, ובמעברים בין החלקים.
   הקווים נמתחים פעם אחת כשהרשת נכנסת למסך, וכמה נקודות נושמות לאט. בלי ספריות. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var html = document.documentElement;
  var anim = html.classList.contains("anim");

  // the same web on every visit: a seeded random, not Math.random
  function seeded(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  function draw(host, first) {
    var w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    var rand = seeded(+host.getAttribute("data-seed") || 7);
    // the mesh opens up on wide screens and tightens on a phone, like the logo sketch at any size
    var step = Math.max(58, Math.min(104, window.innerWidth / 14));
    var pts = [], x, y;
    for (y = -step / 2; y < h + step / 2; y += step * 0.86) {
      for (x = -step / 2; x < w + step / 2; x += step) {
        pts.push([x + (rand() - 0.5) * step * 0.9, y + (rand() - 0.5) * step * 0.8]);
      }
    }
    // each point holds on to its three nearest neighbours: triangles, not a grid
    var seen = {}, edges = [], max = step * step * 2.9;
    pts.forEach(function (p, i) {
      pts.map(function (q, j) { var dx = q[0] - p[0], dy = q[1] - p[1]; return [dx * dx + dy * dy, j]; })
        .sort(function (a, b) { return a[0] - b[0]; })
        .slice(1, 4)
        .forEach(function (e) {
          var a = Math.min(i, e[1]), b = Math.max(i, e[1]), k = a + "-" + b;
          if (!seen[k] && e[0] < max) { seen[k] = 1; edges.push([a, b]); }
        });
    });

    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.setAttribute("preserveAspectRatio", "none");
    // the draw-in runs from the start of the line of reading (right in RTL) to its end
    function delay(px) { return ((w - px) / w * 0.9).toFixed(2) + "s"; }
    edges.forEach(function (e) {
      var p = pts[e[0]], q = pts[e[1]], l = document.createElementNS(NS, "line");
      l.setAttribute("x1", p[0].toFixed(1)); l.setAttribute("y1", p[1].toFixed(1));
      l.setAttribute("x2", q[0].toFixed(1)); l.setAttribute("y2", q[1].toFixed(1));
      l.setAttribute("pathLength", "1");
      l.style.setProperty("--d", delay(Math.max(p[0], q[0])));
      svg.appendChild(l);
    });
    pts.forEach(function (p, i) {
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", p[0].toFixed(1)); c.setAttribute("cy", p[1].toFixed(1));
      c.setAttribute("r", i % 9 === 0 ? 3 : 2.1);
      c.style.setProperty("--d", delay(p[0]));
      if (i % 7 === 3) { c.setAttribute("class", "breathe"); c.style.setProperty("--b", (i % 5) * 0.9 + "s"); }
      svg.appendChild(c);
    });
    host.textContent = "";
    host.appendChild(svg);
    if (!first) host.classList.remove("wait");
  }

  function make(parent, cls, seed, before) {
    if (!parent) return null;
    var d = document.createElement("div");
    d.className = "web " + cls + (anim ? " wait" : "");
    d.setAttribute("aria-hidden", "true");
    d.setAttribute("data-seed", seed);
    parent.insertBefore(d, before ? parent.firstChild : null);
    return d;
  }

  var hosts = [
    make(document.querySelector(".hero-vis"), "web-hero", 11, true),
    make(document.querySelector(".about"), "web-seam", 23, true),
    make(document.querySelector(".sheet"), "web-seam", 37, true),
    make(document.querySelector(".ft"), "web-seam", 41, true)
  ].filter(Boolean);
  hosts.forEach(function (h) { draw(h, true); });

  if (anim && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.remove("wait"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -10% 0px" });
    hosts.forEach(function (h) { io.observe(h); });
  } else {
    hosts.forEach(function (h) { h.classList.remove("wait"); });
  }

  // redraw only when the width really changes (a phone's toolbar changes the height on every scroll)
  var lastW = window.innerWidth, t;
  window.addEventListener("resize", function () {
    clearTimeout(t);
    t = setTimeout(function () {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      hosts.forEach(function (h) { draw(h, false); });
    }, 200);
  });
})();
