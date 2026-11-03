/* אימון יוצר · בסקיצה יש רק את עמוד הבית: קישור לעמוד שעוד לא נבנה נשאר כאן ומקבל שורה קצרה, במקום עמוד שגיאה. יורד כשהעמודים נבנים. */
(function () {
  "use strict";
  var note = document.createElement("p"), timer;
  note.className = "sketch-note";
  note.setAttribute("role", "status");
  document.body.appendChild(note);

  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]"); if (!a) return;
    if (/^(#|[a-z]+:)/i.test(a.getAttribute("href"))) return;
    e.preventDefault();
    note.textContent = "בשלב הסקיצה הקישור הזה עדיין לא פעיל.";
    note.classList.add("on");
    clearTimeout(timer);
    timer = setTimeout(function () { note.classList.remove("on"); }, 4000);
  });
})();
