// Index Gallery: one view at a time, chosen by the hash (#about, #archive,
// #exhibition or another exhibition's slug, empty for home). Pages change with
// a plain dissolve. Each view plays its entrance when it opens, and the
// archive's photographs uncover as they scroll in.
(() => {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  // --vw is the window width without the scrollbar, so the Figma px fit exactly
  const setWidth = () => root.style.setProperty("--vw", root.clientWidth + "px");
  setWidth();
  new ResizeObserver(setWidth).observe(root);
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  // ---------- the outlined titles, inlined so their strokes can draw ----------

  // Each title is fitted into the window: whole and readable, at most Figma's
  // size, and as close as it can stay to where Figma put it, so the
  // composition with the tabs holds on any window shape.
  const MARGIN = 0.03; // of the window's shorter side
  function fitTitles() {
    const W = root.clientWidth, H = innerHeight;
    const u = Math.min(W / 1920, H / 1080);
    const ox = (W - 1920 * u) / 2, oy = (H - 1080 * u) / 2;
    const m = Math.min(W, H) * MARGIN;
    document.querySelectorAll(".title svg").forEach((svg) => {
      const el = svg.parentElement;
      const b = svg.getBBox();
      const sw = 4; // the stroke, in Figma px
      const L = el.offsetLeft / u, T = el.offsetTop / u; // the title's place on the slide
      const gx = ox + (L + b.x - sw) * u, gy = oy + (T + b.y - sw) * u;
      const gw = (b.width + 2 * sw) * u, gh = (b.height + 2 * sw) * u;
      const k = Math.min(1, (W - 2 * m) / gw, (H - 2 * m) / gh);
      const cx = gx + gw / 2, cy = gy + gh / 2;
      const nx = Math.min(Math.max(cx, m + (gw * k) / 2), W - m - (gw * k) / 2);
      const ny = Math.min(Math.max(cy, m + (gh * k) / 2), H - m - (gh * k) / 2);
      el.style.setProperty("--ox", (b.x + b.width / 2) * u + "px");
      el.style.setProperty("--oy", (b.y + b.height / 2) * u + "px");
      el.style.setProperty("--k", k);
      el.style.setProperty("--tx", nx - cx + "px");
      el.style.setProperty("--ty", ny - cy + "px");
    });
  }

  const titlesReady = Promise.all(
    [...document.querySelectorAll(".title[data-src]")].map((el) =>
      fetch(el.dataset.src)
        .then((r) => r.text())
        .then((svg) => (el.innerHTML = svg))
        .catch(() => {})
    )
  ).then(() => {
    fitTitles();
    addEventListener("resize", fitTitles);
  });

  // ---------- the exhibitions in the archive ----------
  // Second Nature is the page in the markup; the others are built from it.
  // Texts for taxonomy, haifa and campus come from the printed brochure
  // ("ברושור 3 תערוכות"). The other four have only a title and a photograph in
  // the design, so their texts are drafts to be replaced.

  const DRAFT_CREDIT = {
    he: "הפקה:<br>גלריה אינדקס",
    ar: "إنتاج:<br>معرض إندكس",
    en: "Produced by:<br>Gallery Index",
  };
  const ARCHIVE_HEAD = { he: "ארכיון תערוכות", en: "Exhibition Archive", ar: "أرشيف المعارض" };
  const vitrine = (n) => ({ he: `ויטרינה ${n}`, en: `Vitrine ${n}`, ar: `الواجهة ${n}` });
  const GALLERY_BOOKS = [[["Gallery Index", "University of Haifa"]]];

  const EXHIBITIONS = {
    layers: {
      title: { en: "Layers of<br>Preservation", ar: "طبقات الحفظ", he: "שכבות של שימור" },
      credit: DRAFT_CREDIT,
      desc: {
        en: "Layers of dried and pressed plants consider preservation as a slow writing of time.",
        ar: "طبقات من النباتات المجففة والزهور المكبوسة تتأمل الحفظ ككتابة بطيئة للزمن.",
        he: "שכבות של צמחים מיובשים ופרחים כבושים בוחנות את השימור ככתיבה איטית של זמן.",
      },
      head: ARCHIVE_HEAD, books: GALLERY_BOOKS,
      imgs: [["layers-3.jpg", 1400 / 933], ["layers-2.jpg", 1400 / 1840], ["layers.jpg", 516 / 750], ["layers-1.jpg", 1400 / 789], ["layers-4.jpg", 1400 / 1050]],
    },
    "system-core": {
      title: { en: "System Core", ar: "نواة النظام", he: "מרכזי שיטה" },
      credit: DRAFT_CREDIT,
      desc: {
        en: "A web of lines and nodes reveals the hidden structure that holds a space together.",
        ar: "شبكة من الخطوط والعُقد تكشف البنية الخفية التي تمسك بالمكان.",
        he: "רשת של קווים וצמתים חושפת את המבנה הנסתר שמחזיק את המרחב.",
      },
      head: ARCHIVE_HEAD, books: GALLERY_BOOKS,
      imgs: [["system-core-1.jpg", 1400 / 933], ["system-core-3.jpg", 1400 / 2489], ["system-core.jpg", 422 / 750], ["system-core-4.jpg", 1400 / 932], ["system-core-2.jpg", 1400 / 2112]],
    },
    objects: {
      title: { en: "Objects in Transit", ar: "أجسام في العبور", he: "אובייקטים במעבר" },
      credit: DRAFT_CREDIT,
      desc: {
        en: "Objects on their way between collections, and what happens to them in the meantime.",
        ar: "قطع في طريقها بين مجموعة وأخرى، وما يحدث لها في المسافة بينهما.",
        he: "פריטים שנמצאים בדרך בין אוסף לאוסף, ומה שקורה להם ברגע שבין לבין.",
      },
      head: ARCHIVE_HEAD, books: GALLERY_BOOKS,
      imgs: [["objects-4.jpg", 2 / 3], ["objects-2.jpg", 2 / 3], ["objects.jpg", 500 / 750], ["objects-1.jpg", 1400 / 933], ["objects-3.jpg", 2 / 3]],
    },
    lines: {
      title: { en: "Lines of Passage", ar: "خطوط عبور", he: "קווי מעבר" },
      credit: DRAFT_CREDIT,
      desc: {
        en: "Road markings in public space, read as a system of movement, pause and direction.",
        ar: "علامات العبور في الفضاء العام كمنظومة من الحركة والتوقف والاتجاه.",
        he: "סימוני מעבר במרחב הציבורי כמערכת של תנועה, עצירה וכיוון.",
      },
      head: ARCHIVE_HEAD, books: GALLERY_BOOKS,
      imgs: [["lines-4.jpg", 1400 / 933], ["lines-2.jpg", 1400 / 2097], ["lines-3.jpg", 2 / 3], ["lines.jpg", 1125 / 750], ["lines-1.jpg", 1400 / 933]],
    },
    taxonomy: {
      title: { en: "Taxonomy Research<br>Laboratory", ar: "مختبر أبحاث<br>التصنيف", he: "מעבדת חקר<br>טקסונומיה" },
      credit: {
        he: "הפקה:<br>בית הספר לעיצוב",
        ar: "إنتاج:<br>مدرسة التصميم",
        en: "Produced by:<br>School of Design",
      },
      desc: {
        en: "Visual communication students explore how sorting, cataloguing and documenting become tools for visual thinking.",
        ar: "أعمال طلاب الاتصال البصري تبحث كيف يصبح التصنيف والفهرسة والتوثيق أدوات للتفكير البصري.",
        he: "עבודות סטודנטים לתקשורת חזותית הבוחנות כיצד מיון, קטלוג ותיעוד הופכים לכלים לחשיבה חזותית.",
      },
      head: vitrine("05"),
      books: [
        [["School of Design", "University of Haifa"], ["DriftLab", "Residency programme"]],
        [["IOLR", "Israel Oceanographic and Limnological Research"]],
      ],
      imgs: [["taxonomy-1.jpg", 1400 / 935], ["taxonomy-3.jpg", 1400 / 1201], ["taxonomy-4.jpg", 1400 / 933], ["taxonomy.jpg", 1344 / 896], ["taxonomy-2.jpg", 1400 / 935]],
    },
    haifa: {
      title: { en: "Who’s the Most<br>Haifa in the City?", ar: "ما هو الأكثر حيفا<br>في المدينة؟", he: "מי הכי חיפה<br>בעיר?" },
      credit: {
        he: "מהאוסף של:<br>ד״ר ראובן הכט",
        ar: "من مجموعة:<br>د. رؤوفين هيخت",
        en: "From the collection of:<br>Dr. Reuven Hecht",
      },
      desc: {
        en: "Five photobooks published by the Haifa Municipality and Shikmona, 1958–2007, tracing the city’s changing image.",
        ar: "خمسة ألبومات صور أصدرتها بلدية حيفا ودار شكمونا بين 1958 و2007، تعكس صورة المدينة المتغيرة.",
        he: "חמישה אלבומי תצלומים של עיריית חיפה והוצאת שקמונה, 1958–2007, המשקפים את התדמית המשתנה של העיר.",
      },
      head: vitrine("04"),
      books: [
        [["Haifa Municipality", "Photobooks, 1958–2007"], ["Shikmona", "Publishing house"]],
        [["Dr. Reuven Hecht", "Collection"]],
      ],
      imgs: [["haifa-2.jpg", 1400 / 930], ["haifa-1.jpg", 2 / 3], ["haifa-4.jpg", 1400 / 1777], ["haifa.jpg", 1344 / 896], ["haifa-3.jpg", 1400 / 933]],
    },
    campus: {
      title: { en: "The Campus Through<br>Different Eyes", ar: "الحرم الجامعي<br>بعيون أخرى", he: "קמפוס<br>בעיניים אחרות" },
      credit: {
        he: "לרגל:<br>יום העיוור הבינלאומי",
        ar: "بمناسبة:<br>اليوم العالمي للمكفوفين",
        en: "Marking:<br>International Blind Day",
      },
      desc: {
        en: "Six photographs by blind and visually impaired students, each paired with a personal story from campus.",
        ar: "ست صور لطلاب مكفوفين وضعاف بصر، ترافق كلًّا منها قصة شخصية من الحرم الجامعي.",
        he: "שישה צילומים של סטודנטים עיוורים ולקויי ראייה, המלווים בסיפוריהם האישיים מתוך הקמפוס.",
      },
      head: vitrine("06"),
      books: [
        [["Six photographs", "Six personal stories"]],
        [["Audio texts", "Through QR codes in the space"]],
      ],
      imgs: [["campus-1.jpg", 1400 / 933], ["campus-2.jpg", 1400 / 1723], ["campus-4.jpg", 2 / 3], ["eyes.jpg", 1344 / 896], ["campus-3.jpg", 1400 / 935]],
    },
  };

  // exhibition pages open still: no entrance on the frame or the photographs
  const template = document.querySelector('.view[data-view="exhibition"]');

  // the photographs take Second Nature's places (2398:531): slots A, B, C, the
  // wide D, and F under it. Each keeps its own proportions at the slot's
  // width, and every other page is mirrored so no two read the same.
  const SLOTS = [
    { x: 123.15, y: 293.53, w: 439.996 },
    { x: 1296.51, y: 403.26, w: 278.745 },
    { x: 605.52, y: 816.41, w: 235.985 },
    { x: 32, y: 1284.72, w: 1668.35 },
    { x: 235.47, y: 2847.26, w: 458.633 },
  ];
  Object.entries(EXHIBITIONS).forEach(([slug, ex], index) => {
    const v = template.cloneNode(true);
    v.dataset.view = slug;
    v.setAttribute("aria-label", ex.title.en.replace(/<br>/g, " "));
    const f = (name) => v.querySelector(`[data-f="${name}"]`);
    for (const lang of ["en", "ar", "he"]) {
      f(`title-${lang}`).innerHTML = ex.title[lang];
      f(`title-${lang}`).removeAttribute("style");
      f(`desc-${lang}`).textContent = ex.desc[lang];
      f(`credit-${lang}`).innerHTML = ex.credit[lang];
      f(`head-${lang}`).textContent = ex.head[lang];
    }
    // these pages are reached from the archive, so their back arrow returns there
    f("back").setAttribute("href", "#archive");
    f("back").setAttribute("aria-label", "Back to the exhibition archive");
    f("books").innerHTML = ex.books
      .map((col) => `<div>${col.map(([b, t]) => `<p><b>${b}</b><br>${t}</p>`).join("")}</div>`)
      .join("");
    let bottom = 0, wideBottom = 0;
    f("imgs").innerHTML = ex.imgs
      .map(([file, ratio], k) => {
        const s = SLOTS[k];
        const h = s.w / ratio;
        // the last photograph keeps its distance below the wide one
        const y = k === 4 ? Math.max(s.y, wideBottom + 420) : s.y;
        const x = index % 2 ? 1732 - s.x - s.w : s.x;
        if (k === 3) wideBottom = y + h;
        bottom = Math.max(bottom, y + h);
        return `<div class="ex-img" style="--x:${x.toFixed(2)};--y:${y.toFixed(2)};--w:${s.w};--h:${h.toFixed(2)}"><img src="img/${file}" alt=""></div>`;
      })
      .join("");
    f("page").style.setProperty("--page", Math.round(bottom + 61));
    template.after(v);
  });

  // ---------- views ----------

  const views = {};
  document.querySelectorAll(".view").forEach((v) => (views[v.dataset.view] = v));
  let current = null;

  // an exhibition's frame draws itself: every border in it becomes a line
  // in an svg laid over the frame, drawn from the top left outwards; then
  // the real borders take over and the text fades in
  function drawFrame(v) {
    const box = v.querySelector(".ex-box");
    box.querySelector(".ex-draw")?.remove();
    const B = box.getBoundingClientRect();
    const lines = new Map();
    const add = (x1, y1, x2, y2) => {
      const k = [x1, y1, x2, y2].map(Math.round).join();
      if (x2 - x1 > 1 || y2 - y1 > 1) lines.set(k, [x1, y1, x2, y2]);
    };
    [box, ...box.querySelectorAll("*")].forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.borderTopStyle === "none" && cs.borderLeftStyle === "none" && cs.borderRightStyle === "none" && cs.borderBottomStyle === "none") return;
      const r = el.getBoundingClientRect();
      const x = r.left - B.left + 0.5, y = r.top - B.top + 0.5, X = r.right - B.left - 0.5, Y = r.bottom - B.top - 0.5;
      if (parseFloat(cs.borderTopWidth)) add(x, y, X, y);
      if (parseFloat(cs.borderBottomWidth)) add(x, Y, X, Y);
      if (parseFloat(cs.borderLeftWidth)) add(x, y, x, Y);
      if (parseFloat(cs.borderRightWidth)) add(X, y, X, Y);
    });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "ex-draw");
    svg.setAttribute("width", B.width);
    svg.setAttribute("height", B.height);
    svg.innerHTML = [...lines.values()]
      .map(([x1, y1, x2, y2]) => {
        const d = (Math.min(y1, y2) / B.height) * 0.45 + (Math.min(x1, x2) / B.width) * 0.25;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" pathLength="1" style="--d:${d.toFixed(3)}s"/>`;
      })
      .join("");
    v.classList.add("drawing");
    box.append(svg);
    setTimeout(() => {
      v.classList.remove("drawing");
      svg.remove();
    }, 1250);
  }

  function enter(v) {
    v.classList.remove("in");
    v.getBoundingClientRect();
    if (v.classList.contains("exhibition") && !reduced.matches) drawFrame(v);
    const go = () => requestAnimationFrame(() => v.classList.add("in"));
    // home waits for its title so the drawing starts from nothing
    v === views.home ? titlesReady.then(go) : go();
  }

  // changing page: the window fades into the new page's colour, the page
  // takes its place underneath, and the colour fades away
  const veil = document.createElement("div");
  veil.className = "veil";
  document.body.append(veil);
  const COLOUR = { home: "--blue", about: "--orange", archive: "--grey-blue", exhibition: "--paper" };
  const kind = (v) => (v.classList.contains("exhibition") ? "exhibition" : v.dataset.view);
  let pending = null;

  function go() {
    const next = views[decodeURIComponent(location.hash.slice(1))] || views.home;
    if (next === current) return;
    if (reduced.matches || !current) return show();
    clearTimeout(pending);
    veil.style.background = `var(${COLOUR[kind(next)]})`;
    veil.classList.add("on");
    pending = setTimeout(() => {
      show();
      veil.classList.remove("on");
    }, 320);
  }

  function show() {
    const name = decodeURIComponent(location.hash.slice(1));
    const next = views[name] || views.home;
    if (next === current) return;
    const prev = current;
    current = next;

    if (prev) prev.classList.remove("in");
    // Second Nature opens from both the home tab and the archive: back goes where you came from
    if (next === template && prev) {
      const back = template.querySelector('[data-f="back"]');
      const fromArchive = prev === views.archive;
      back.setAttribute("href", fromArchive ? "#archive" : "#");
      back.setAttribute("aria-label", fromArchive ? "Back to the exhibition archive" : "Back to Gallery Index");
    }
    Object.values(views).forEach((v) => (v.hidden = v !== next));
    next.hidden = false;
    document.body.dataset.view = kind(next);
    document.title = (next === views.home ? "" : next.getAttribute("aria-label") + " · ") + "Index Gallery · גלריה אינדקס";
    scrollTo(0, 0);
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    enter(next);
  }

  // the back arrows go home without leaving an empty "#" in the address
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href="#"]');
    if (!a) return;
    e.preventDefault();
    if (location.hash) {
      history.pushState(null, "", location.pathname + location.search);
      go();
    }
  });

  show();
  addEventListener("hashchange", go);
  addEventListener("popstate", go);
})();
