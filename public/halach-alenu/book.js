/*
 * הלך עלינו — a choose-your-path book that turns like a real one.
 *
 * The book is right-to-left: the spine is on the right of the front cover,
 * pages turn from left to right, and every spread holds an even page on the
 * right and the odd page after it on the left. The reader moves through
 * "spreads" (what lies open on the desk), numbered from 0 = closed.
 */
(async () => {
  const $ = (id) => document.getElementById(id);
  const book = $("book"), desk = $("desk");
  const pageL = $("pageL"), pageR = $("pageR"), boardL = $("boardL"), boardR = $("boardR");
  const turnNext = $("turnNext"), turnPrev = $("turnPrev");
  const cta = $("cta"), ctaLabel = $("ctaLabel");

  const data = await fetch("book.json").then((r) => r.json());
  const ASPECT = data.pageAspect;          // page width / height, from the PDF trim box
  const COVER_SCALE = data.coverScale;     // board height / page height
  const LINKS = data.links;                // { page: [{ to, r: [x, y, w, h] as page fractions }] }
  const PAGE_W_PT = 354.33, PAGE_H_PT = 467.72;   // the trim size, 125 × 165 mm

  const LAST_SPREAD = 106;                 // pages 208 | blank
  const spreadOf = (n) => (n === 1 ? 2 : Math.floor(n / 2) + 2);
  const START = spreadOf(6);               // the first decision
  const DEATH = spreadOf(206);             // "מתת" — every bad end leads here
  // pages 170–205 are one outcome each, two to a spread: only the one the
  // reader was sent to may be followed
  const isSingle = (n) => n >= 170 && n <= 205;

  const pad3 = (n) => String(n).padStart(3, "0");
  const PAPER = { t: "blank" };

  function spread(i) {
    if (i === 0) return { left: { t: "cover" }, right: null };
    if (i === 1) return { right: { t: "img", src: "endpaper-r.webp" }, left: { t: "img", src: "endpaper-l.webp" } };
    if (i === 2) return { right: PAPER, left: { t: "page", n: 1 } };
    if (i === LAST_SPREAD) return { right: { t: "page", n: 208 }, left: PAPER };
    const k = i - 2;
    return { right: { t: "page", n: 2 * k }, left: { t: "page", n: 2 * k + 1 } };
  }
  const srcOf = (d) =>
    !d ? null : d.t === "page" ? `pages/${pad3(d.n)}.webp` : d.t === "img" ? d.src : d.t === "cover" ? "cover-front.webp" : null;

  /* ---------- images ---------- */
  const cache = new Map();
  function load(src) {
    if (!src) return Promise.resolve();
    if (!cache.has(src)) {
      const img = new Image();
      const loaded = new Promise((r) => { img.onload = img.onerror = r; });
      img.src = src;
      // decoding first saves a blank flash mid-turn, but some browsers sit on
      // decode() for a long time, so a plain load (plus a beat) is enough
      cache.set(src, Promise.race([img.decode().catch(() => {}), loaded.then(() => new Promise((r) => setTimeout(r, 120)))]));
    }
    return cache.get(src);
  }
  const loadSpread = (i) => { const s = spread(i); return Promise.all([load(srcOf(s.left)), load(srcOf(s.right))]); };
  const within = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);

  /* ---------- layout ---------- */
  const PHONE_SIDEWAYS = matchMedia("(max-height: 520px) and (pointer: coarse)");
  let pw = 0, ph = 0;
  function layout() {
    const W = desk.clientWidth, H = desk.clientHeight;
    // a phone on its side, not just a short frame: the portfolio tile is short too
    const short = PHONE_SIDEWAYS.matches;
    // room under the book for the button, mirrored above so the book stays centred
    const padY = short ? 34 : 76;
    // the turn arrows stand outside the book, so leave them a lane on each side
    const padX = short || W < 760 ? 52 : 88;
    // it lives in a tile of the portfolio page, so it fills its frame, with a little air
    const room = short || W < 760 ? 1 : 0.92;
    ph = Math.floor(room * Math.min((H - padY * 2) / COVER_SCALE, (W - padX * 2) / (2 * ASPECT * 1.04)));
    pw = Math.round(ph * ASPECT);
    const ov = Math.round(((COVER_SCALE - 1) / 2) * ph);
    book.style.setProperty("--pw", pw + "px");
    book.style.setProperty("--ph", ph + "px");
    book.style.setProperty("--ov", ov + "px");
    for (const el of [desk, $("stage")]) {
      el.style.setProperty("--ph", ph + "px");
      el.style.setProperty("--pw", pw + "px");
      el.style.setProperty("--ov", ov + "px");
    }
    setEdges();
    setHalf(cur);
  }
  // how far the book reaches from the centre of the desk, for the turn arrows
  function setHalf(i) {
    const e = Math.max(3, Math.round(pw * 0.02));
    desk.style.setProperty("--half", (i === 0 ? pw / 2 + 4 : pw + e + 4) + "px");
  }
  // the block's edge shows equally on both sides, like a book lying open
  function setEdges() {
    const e = Math.max(3, Math.round(pw * 0.02)) + "px";
    book.style.setProperty("--eL", e);
    book.style.setProperty("--eR", e);
  }

  /* ---------- drawing a page ---------- */
  function paint(el, d, side) {
    el.className = el.className.replace(/\b(none|blank|turn)\b/g, "").trim();
    el.replaceChildren();
    el.style.backgroundImage = "";
    el.removeAttribute("aria-label");
    if (!d) { el.classList.add("none"); return; }
    const src = srcOf(d);
    if (src) el.style.backgroundImage = `url("${src}")`;
    else el.classList.add("blank");
    if (d.t === "page") el.setAttribute("aria-label", `עמוד ${d.n}`);
    const sealed = isSingle(d.t === "page" ? d.n : 0) && reached !== d.n;
    if (d.t === "page" && LINKS[d.n] && el.classList.contains("page")) {
      const wrap = document.createElement("div"); wrap.className = "links";
      for (const l of LINKS[d.n]) {
        const b = document.createElement("button");
        b.type = "button"; b.className = "choice";
        b.setAttribute("aria-label", `לך לעמוד ${l.to}`);
        const [x, y, w, h] = l.r;
        Object.assign(b.style, { left: x * 100 + "%", top: y * 100 + "%", width: w * 100 + "%", height: h * 100 + "%" });
        // the extractor padded each hotspot by 6pt sideways and 5pt below the text
        b.style.setProperty("--ix", (6 / (w * PAGE_W_PT)) * 100 + "%");
        b.style.setProperty("--ib", (5 / (h * PAGE_H_PT)) * 100 + "%");
        inkFor(srcOf(d), l.r).then(({ ink, paper }) => {
          b.style.setProperty("--line", ink);
          b.style.setProperty("--paper-here", paper);
        });
        if (sealed) {
          // the reader wasn't sent here: the option stays on the page, faded and inert
          b.disabled = true;
          b.classList.add("off");
        } else b.addEventListener("click", (e) => { e.stopPropagation(); choose(l.to); });
        wrap.append(b);
      }
      el.append(wrap);
    }
  }
  // the underline takes the colour of the type it sits under: sample the patch's paper
  const inks = new Map();
  const FALLBACK = { ink: "#1d1b19", paper: "#fbfaf7" };
  function inkFor(src, [x, y, w, h]) {
    const key = `${src}|${x}|${y}`;
    if (!inks.has(key)) {
      inks.set(key, new Promise((done) => {
        const img = new Image();
        img.onload = () => {
          try {
            const c = document.createElement("canvas"); c.width = c.height = 8;
            const g = c.getContext("2d");
            g.drawImage(img, x * img.width, y * img.height, w * img.width, h * img.height, 0, 0, 8, 8);
            const px = g.getImageData(0, 0, 8, 8).data;
            // the paper is the lightest (or, on dark pages, darkest) tone in the patch
            const n = px.length / 4; let sum = 0;
            const tones = [];
            for (let i = 0; i < px.length; i += 4) { const t = px[i] + px[i + 1] + px[i + 2]; sum += t; tones.push([t, i]); }
            const light = sum / n / 3 > 170;
            tones.sort((a, b) => (light ? b[0] - a[0] : a[0] - b[0]));
            const p = tones[Math.floor(n * 0.2)][1];
            done({ ink: light ? "#1d1b19" : "#ffffff", paper: `rgb(${px[p]}, ${px[p + 1]}, ${px[p + 2]})` });
          } catch { done(FALLBACK); }
        };
        img.onerror = () => done(FALLBACK);
        img.src = src;
      }));
    }
    return inks.get(key);
  }

  function face(d, side, extra = "") {
    const f = document.createElement("div");
    f.className = `face ${side} ${extra}`;
    const src = srcOf(d);
    if (src) f.style.backgroundImage = `url("${src}")`; else f.classList.add("blank");
    const s = document.createElement("div"); s.className = "shade"; f.append(s);
    return f;
  }
  function coverFace(kind, extra) {
    const f = document.createElement("div");
    f.className = `face ${extra} ${kind}`;
    if (kind === "coverimg") f.style.backgroundImage = 'url("cover-front.webp")';
    else { const p = document.createElement("div"); p.className = "paste"; p.style.backgroundImage = 'url("endpaper-r.webp")'; f.append(p); }
    const s = document.createElement("div"); s.className = "shade"; f.append(s);
    return f;
  }

  /* ---------- state ---------- */
  let cur = 0, busy = false;
  let reached = null;   // the page a choice sent the reader to
  const trail = [];
  let nudged = false;

  function render(i) {
    const s = spread(i);
    book.classList.toggle("closed", i === 0);
    boardL.classList.toggle("cover", i === 0);
    boardL.style.backgroundImage = i === 0 ? 'url("cover-front.webp")' : "";
    boardR.classList.toggle("off", i === 0);
    paint(pageL, i === 0 ? null : s.left, "l");
    paint(pageR, s.right, "r");

    // front matter turns by hand; from the first decision on, only choices move you
    if (i > 0 && i < START) pageL.classList.add("turn");
    if (i > 0 && i < START && i > 1) pageR.classList.add("turn");

    const nums = [s.right, s.left].filter((d) => d?.t === "page").map((d) => d.n);

    if (i === START && !nudged) { nudged = true; book.classList.add("nudge"); setTimeout(() => book.classList.remove("nudge"), 5000); }

    // around the book: turn arrows while the pages turn freely, and one
    // button below: "Open the book" on the cover (the cover needs no arrow
    // beside it), "Start over" after a death
    setHalf(i);
    turnNext.hidden = i === 0 || i >= START;
    turnPrev.hidden = !(i >= 1 && i <= START);
    cta.hidden = !(i === 0 || i === DEATH);
    cta.classList.toggle("over", i === DEATH);
    ctaLabel.textContent = i === 0 ? "Open the book" : "Start over";

    // the address names the page reached, so a reload keeps the right choice live
    const n = reached && nums.includes(reached) ? reached : nums[0];
    history.replaceState(null, "", i === 0 ? location.pathname + location.search : `#${i === 1 ? "open" : n}`);

    // fetch where the reader can go next
    for (const d of [s.left, s.right]) for (const l of (d?.t === "page" && LINKS[d.n]) || []) loadSpread(spreadOf(l.to));
    if (i < START) loadSpread(i + 1);
    if (i === DEATH) loadSpread(START);
  }

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  async function go(target, { push = true, page = null } = {}) {
    if (busy || target === cur || target < 0 || target > LAST_SPREAD) return;
    busy = true;
    const from = cur, dir = target > from ? 1 : -1, dist = Math.abs(target - from);
    await within(loadSpread(target), 2500);
    if (push) trail.push({ i: from, page: reached });
    reached = page;

    if (reduced.matches) { cur = target; render(cur); busy = false; return; }

    const S = spread(from), T = spread(target);
    const K = dist === 1 ? 1 : Math.min(9, 2 + Math.round(Math.log2(dist) * 1.3));
    const dur = K === 1 ? (from === 0 || target === 0 ? 1100 : 900) : 720;
    const stagger = K === 1 ? 0 : Math.max(55, Math.min(130, 700 / K));
    const ease = "cubic-bezier(.42,.08,.26,1)";

    // what stays still underneath while leaves turn
    for (const el of [pageL, pageR]) el.querySelector(".links")?.remove();
    if (dir > 0) {
      paint(pageL, T.left, "l");
      if (from === 0) { book.classList.remove("closed"); boardL.classList.remove("cover"); boardL.style.backgroundImage = ""; }
    } else {
      paint(pageR, target === 0 ? null : T.right, "r");
      if (target === 0) { boardR.classList.add("off"); book.classList.add("closed"); }
    }
    for (const el of [pageL, pageR]) el.classList.remove("turn");
    setHalf(target);

    const leaves = [];
    for (let i = 0; i < K; i++) {
      const leaf = document.createElement("div");
      const first = i === 0, last = i === K - 1;
      const isCover = (dir > 0 && first && from === 0) || (dir < 0 && last && target === 0);
      leaf.className = `leaf ${dir > 0 ? "fwd" : "bwd"}${isCover ? " cover" : ""}`;
      if (dir > 0) {
        leaf.append(
          isCover ? coverFace("coverimg", "front") : face(first ? S.left : PAPER, "l", "front"),
          isCover ? coverFace("boardpaste", "back") : face(last ? T.right : PAPER, "r", "back"),
        );
      } else {
        leaf.append(
          isCover ? coverFace("boardpaste", "front") : face(first ? S.right : PAPER, "r", "front"),
          isCover ? coverFace("coverimg", "back") : face(last ? T.left : PAPER, "l", "back"),
        );
      }
      leaf.style.zIndex = 20 + K - i;
      book.append(leaf);
      leaves.push(leaf);
    }

    const casts = ["left", "right"].map((side) => {
      const c = document.createElement("div"); c.className = `cast ${side}`; book.append(c); return c;
    });
    const total = dur + stagger * (K - 1);
    const [castFrom, castTo] = dir > 0 ? casts : [casts[1], casts[0]];
    castFrom.animate([{ opacity: 0 }, { opacity: 0.9, offset: 0.15 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }], { duration: total, easing: "linear" });
    castTo.animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 0.8, offset: 0.8 }, { opacity: 0 }], { duration: total, easing: "linear" });

    const deg = dir > 0 ? 180 : -180;
    const runs = leaves.map((leaf, i) => {
      const opts = { duration: dur, delay: i * stagger, easing: ease, fill: "forwards" };
      const [front, back] = leaf.querySelectorAll(".face");
      front.querySelector(".shade").animate([{ opacity: 0 }, { opacity: 1, offset: 0.5 }, { opacity: 1 }], opts);
      back.querySelector(".shade").animate([{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], opts);
      // z-index is discrete, so it swaps at the halfway point: a leaf that has
      // crossed the spine lands on top of the ones that crossed before it
      return leaf.animate(
        [
          { transform: `perspective(${pw * 8}px) rotateY(0deg)`, zIndex: 20 + K - i },
          { transform: `perspective(${pw * 8}px) rotateY(${deg / 2}deg)`, zIndex: 20 + K - i, offset: 0.4999 },
          { transform: `perspective(${pw * 8}px) rotateY(${deg / 2}deg)`, zIndex: 40 + i, offset: 0.5 },
          { transform: `perspective(${pw * 8}px) rotateY(${deg}deg)`, zIndex: 40 + i },
        ],
        opts,
      ).finished;
    });
    await Promise.all(runs);

    cur = target;
    render(cur);
    leaves.forEach((l) => l.remove());
    casts.forEach((c) => c.remove());
    busy = false;
  }

  function choose(page) { go(spreadOf(page), { page }); }
  function back() {
    if (!trail.length || busy) return;
    const t = trail.pop();
    go(t.i, { push: false, page: t.page });
  }
  function restart() { if (!busy) { trail.length = 0; go(START, { push: false }); } }

  /* ---------- input ---------- */
  boardL.addEventListener("click", () => cur === 0 && go(1));
  pageL.addEventListener("click", () => pageL.classList.contains("turn") && go(cur + 1));
  pageR.addEventListener("click", () => pageR.classList.contains("turn") && back());
  turnNext.addEventListener("click", () => cur < START && go(cur + 1));
  // a step back through the opening pages, whether or not we came that way
  turnPrev.addEventListener("click", () => {
    if (trail.at(-1)?.i === cur - 1) back();
    else go(cur - 1, { push: false });
  });
  cta.addEventListener("click", () => (cur === 0 ? go(1) : restart()));
  addEventListener("keydown", (e) => {
    if (e.target.closest?.("button") && (e.key === "Enter" || e.key === " ")) return;
    if (e.key === "ArrowLeft" || ((e.key === "Enter" || e.key === " ") && cur < START)) {
      if (cur < START) { e.preventDefault(); go(cur + 1); }
    } else if (e.key === "ArrowRight" || e.key === "Backspace") {
      e.preventDefault(); back();
    }
  });
  addEventListener("resize", layout);

  /* ---------- portrait phones ---------- */
  const portrait = matchMedia("(orientation: portrait) and (max-width: 760px)");
  let rotateOk = false;
  const checkRotate = () => { $("rotate").hidden = rotateOk || !portrait.matches; };
  portrait.addEventListener("change", checkRotate);
  $("btnRotateOk").addEventListener("click", () => { rotateOk = true; checkRotate(); });
  checkRotate();

  /* ---------- start ---------- */
  const m = location.hash.match(/^#(\d+)$/);
  const startAt = location.hash === "#open" ? 1 : m && +m[1] >= 1 && +m[1] <= 208 ? spreadOf(+m[1]) : 0;
  book.classList.add("loading");
  await within(Promise.all([load("cover-front.webp"), loadSpread(startAt)]), 4000);
  if (startAt < 2) { load("endpaper-l.webp"); load("endpaper-r.webp"); }
  cur = startAt;
  if (m && isSingle(+m[1])) reached = +m[1];
  layout();
  render(cur);
  requestAnimationFrame(() => book.classList.remove("loading"));
})();
