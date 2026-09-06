/**
 * Seven kinetic-type mechanics for the intro paragraph. One is chosen at random
 * per mount; `reroll` picks a different one. Every node it builds is a child of
 * the stage, which is overflow:hidden — nothing escapes the frame.
 *
 * Deliberately framework-free: React owns the markup, this owns the motion.
 */

import { GROUNDS } from "./palette";

export interface KineticHandles {
  stage: HTMLElement;
  intro: HTMLElement;
  cells: HTMLElement;
  cols: HTMLElement;
  peri: HTMLElement;
  panels: HTMLElement;
}

export interface KineticInstance {
  reroll(): void;
  current(): string;
  destroy(): void;
}

const LABELS = ["0.1M", "0.3M", "0.5M", "48/188", "23:48:05", "A013", "A3B1", "04.11", "18.13M", "AUTO", "0625", "21C"];
const SYMBOLS = "*&%^#@$!?/\\<>+=~".split("");

const PHRASES = [
  "HI, I’M AKI YAMIN,",
  "A MULTIDISCIPLINARY VISUAL DESIGNER",
  "WHO LIKES MAKING COOL SHIT.",
  "IF IT CAN BE PRINTED, CLICKED,",
  "WATCHED OR HELD,",
  "I’M PROBABLY INTERESTED.",
  "IF IT NEEDS MORE THAN ONE OF THOSE,",
  "EVEN BETTER.",
];

const SEGMENTS = [
  ["HI, I’M AKI YAMIN,", "STILL AKI YAMIN,", "AKI YAMIN, OBVIOUSLY,"],
  ["A MULTIDISCIPLINARY VISUAL DESIGNER", "A GUY WITH TOO MANY OPEN TABS", "A DESIGNER, ALLEGEDLY,"],
  ["WHO LIKES MAKING COOL SHIT.", "WHO MAKES SHIT, OCCASIONALLY COOL.", "WHO KEEPS MAKING THINGS ANYWAY."],
  ["IF IT CAN BE PRINTED, CLICKED, WATCHED OR HELD,", "IF IT CAN BE TOUCHED OR SCROLLED,", "IF IT FITS ON A WALL OR A SCREEN,"],
  ["I’M PROBABLY INTERESTED.", "I’M ALREADY IN.", "I’LL PROBABLY SAY YES."],
  ["IF IT NEEDS MORE THAN ONE OF THOSE, EVEN BETTER.", "IF IT NEEDS ALL OF THEM, BETTER STILL.", "THE MESSIER THE BRIEF, THE BETTER."],
];

const rnd = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(a: T[]) => a[rnd(a.length)];
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const range = (a: number, b: number) => a + Math.random() * (b - a);

interface FaceMetrics {
  base: number; capR: number; descR: number; blTopR: number; blBotR: number;
}

/**
 * Real cap height and baseline for the face in use, as ratios of the em.
 * Guessing these leaves dead strips wherever the caps fall short of the box —
 * and Trade Gothic and the Roboto Condensed fallback do not agree.
 */
function faceMetrics(el: HTMLElement): FaceMetrics {
  const cs = getComputedStyle(el);
  const base = parseFloat(cs.fontSize);
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = `700 ${base}px ${cs.fontFamily}`;
  const m = ctx.measureText("H");
  const cap = m.actualBoundingBoxAscent || base * 0.71;
  const asc = m.fontBoundingBoxAscent || base * 0.93;
  const desc = m.fontBoundingBoxDescent || base * 0.24;
  const blFromTop = (base - (asc + desc)) / 2 + asc;
  return { base, capR: cap / base, descR: desc / base, blTopR: blFromTop / base, blBotR: (base - blFromTop) / base };
}

export function mountKinetic(h: KineticHandles, rawText: string): KineticInstance {
  const TEXT = rawText.replace(/\s+/g, " ").trim().toUpperCase();
  const WORDS = TEXT.split(" ");
  const ORIGINAL = h.intro.innerHTML;

  let ac: AbortController | null = null;
  let loopId: number | null = null;
  const timers = new Set<number>();
  let onResize: (() => void) | null = null;

  /* Independent picks land on two colours often enough to look flat; a shuffled
     bag guarantees any composition of three or more uses all three. */
  let bag: string[] = [];
  function deal(): string {
    if (!bag.length) {
      bag = GROUNDS.slice();
      for (let i = bag.length - 1; i > 0; i--) {
        const j = rnd(i + 1);
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }
    return bag.pop()!;
  }

  /* one mechanic runs at a time, so one live frame id is enough */
  const raf = (fn: FrameRequestCallback) => (loopId = requestAnimationFrame(fn));
  function later(fn: () => void, ms: number): number {
    const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
    return id;
  }
  const sig = () => ({ signal: ac!.signal });

  function teardown() {
    ac?.abort();
    if (loopId !== null) { cancelAnimationFrame(loopId); loopId = null; }
    timers.forEach((t) => clearTimeout(t));
    timers.clear();
    onResize = null;
    bag = [];
    h.cells.innerHTML = h.cols.innerHTML = h.peri.innerHTML = h.panels.innerHTML = "";
    h.panels.classList.remove("is-in");
    h.stage.querySelectorAll(".k-zcol").forEach((n) => n.remove());
    h.intro.innerHTML = ORIGINAL;
  }

  /* ---------------- 1. GRID CELL FLIP ---------------- */
  function grid() {
    interface Cell { el: HTMLElement; cx: number; cy: number; on?: number; off?: number }
    let blocks: Cell[] = [];
    let reach = 1, lastX = -1, lastY = -1;
    const SPREAD = 30, HOLD = 520, HOLD_JIT = 320, MOVE = 16;

    function build() {
      h.cells.innerHTML = "";
      blocks = [];
      const COLS = h.stage.clientWidth < 760 ? 9 : 16;
      const ROWS = h.stage.clientHeight < 380 ? 8 : 10;
      const W = h.stage.clientWidth, H = h.stage.clientHeight;
      const cw = W / COLS, chh = H / ROWS;
      reach = Math.min(W * 0.25, H * 0.52);
      const letters = TEXT.replace(/[^A-Z]/g, "").split("");
      const taken = new Array<boolean>(COLS * ROWS).fill(false);

      const fits = (r: number, c: number, bw: number, bh: number) => {
        if (c + bw > COLS || r + bh > ROWS) return false;
        for (let y = r; y < r + bh; y++) for (let x = c; x < c + bw; x++) if (taken[y * COLS + x]) return false;
        return true;
      };

      // walk the grid, drop the largest block that still fits at each free slot
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (taken[r * COLS + c]) continue;
        let bw = pick([1, 1, 1, 2, 2, 3]), bh = pick([1, 1, 2, 2, 3]);
        while (bw > 1 && !fits(r, c, bw, bh)) bw--;
        while (bh > 1 && !fits(r, c, bw, bh)) bh--;
        if (!fits(r, c, bw, bh)) { bw = 1; bh = 1; }
        for (let y = r; y < r + bh; y++) for (let x = c; x < c + bw; x++) taken[y * COLS + x] = true;

        const w = bw * cw, hh = bh * chh, x = c * cw, y = r * chh;
        const el = document.createElement("div");
        el.className = "k-cell";
        el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${hh}px;background:${deal()}`;

        if (Math.random() < 0.15) {
          const l = document.createElement("span");
          l.className = "k-lab";
          l.textContent = pick(LABELS);
          l.style.top = Math.random() < 0.5 ? "5px" : "auto";
          l.style.bottom = l.style.top === "auto" ? "5px" : "auto";
          l.style.left = Math.random() < 0.5 ? "5px" : "auto";
          l.style.right = l.style.left === "auto" ? "5px" : "auto";
          el.appendChild(l);
        } else {
          const g = document.createElement("span");
          g.className = "k-glyph";
          g.textContent = pick(letters);
          const roll = Math.random();
          let fs: number, ox: number, oy: number;
          if (roll < 0.28) { fs = hh * range(0.38, 0.62); ox = range(0.08, 0.5) * w; oy = range(0.05, 0.32) * hh; }
          else if (roll < 0.68) { fs = hh * range(1.0, 1.7); ox = -w * range(0, 0.35); oy = -hh * range(0.05, 0.45); }
          else { fs = hh * range(2.4, 4.0); ox = -w * range(0.2, 1.2); oy = -hh * range(0.5, 1.8); }
          g.style.fontSize = `${fs.toFixed(0)}px`;
          g.style.left = `${ox.toFixed(0)}px`;
          g.style.top = `${oy.toFixed(0)}px`;
          el.appendChild(g);
        }
        h.cells.appendChild(el);
        blocks.push({ el, cx: x + w / 2, cy: y + hh / 2 });
      }
      lastX = lastY = -1;
    }

    // a small ragged patch, never the whole frame
    function flood(px: number, py: number) {
      for (const b of blocks) {
        const d = Math.hypot((b.cx - px) / reach, (b.cy - py) / (reach * 1.15));
        if (d > 1) continue;
        if (Math.random() > 0.22 + (1 - d) * 0.72) continue;
        if (b.on) clearTimeout(b.on);
        if (b.off) clearTimeout(b.off);
        b.on = later(() => {
          b.el.classList.add("is-on");
          b.off = later(() => b.el.classList.remove("is-on"), HOLD + rnd(HOLD_JIT));
        }, (d * reach * SPREAD) / 100);
      }
    }

    h.stage.addEventListener("pointermove", (e) => {
      const r = h.stage.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (lastX >= 0 && Math.hypot(x - lastX, y - lastY) < MOVE) return;
      flood(x, y); lastX = x; lastY = y;
    }, sig());
    h.stage.addEventListener("pointerleave", () => { lastX = lastY = -1; }, sig());

    build();
    onResize = build;
  }

  /* ---------------- 2. ZOOM STACK ---------------- */
  function zoom() {
    const STAGGER = 70, MAX_SY = 16;
    let active: HTMLElement | null = null;
    const colour = PHRASES.map(() => deal());

    h.intro.innerHTML = "";
    PHRASES.forEach((p, i) => {
      const el = document.createElement("span");
      el.className = "k-zseg";
      el.textContent = p;
      el.addEventListener("pointerenter", () => open(el, p, i), sig());
      h.intro.appendChild(el);
      h.intro.appendChild(document.createTextNode(" "));
    });
    h.intro.addEventListener("pointerleave", close, sig());

    function close() {
      if (!active) return;
      const col = active;
      active = null;
      const kids = Array.from(col.children) as HTMLElement[];
      // peel off from the top down, one at a time
      kids.slice().reverse().forEach((b, k) => later(() => { b.style.display = "none"; }, k * Math.round(STAGGER * 0.55)));
      const seg = (col as HTMLElement & { _seg?: HTMLElement })._seg;
      if (seg) seg.style.visibility = "";
      later(() => col.remove(), kids.length * Math.round(STAGGER * 0.55) + 80);
    }

    function open(seg: HTMLElement, text: string, index: number) {
      close();
      const rects = seg.getClientRects();
      const sr = rects.length ? rects[rects.length - 1] : seg.getBoundingClientRect();
      const st = h.stage.getBoundingClientRect();
      const M = faceMetrics(h.intro);
      const base = M.base;
      const left = sr.left - st.left, width = sr.width, bottom = sr.bottom - st.top;
      const ground = colour[index];

      const col = document.createElement("div") as HTMLElement & { _seg?: HTMLElement };
      col.className = "k-zcol";
      col.style.cssText = `left:${left}px;top:0;width:${width}px;height:${bottom}px`;
      col._seg = seg;

      // block height IS the cap height, so the first block sits exactly on the real text
      const items: { y: number; h: number; sx: number }[] = [];
      let y = base * M.descR, sy = 1;
      for (let i = 0; i < 9; i++) {
        const bh = base * M.capR * sy;
        items.push({ y, h: bh, sx: i === 0 ? 1 : range(1.0, 1.2) });
        if (y + bh > bottom) break;
        y += bh * (1 - range(0.4, 0.75));
        if (i >= 1) sy = Math.min(sy * range(1.55, 2.4), MAX_SY);
      }

      const n = items.length;
      const built = items.map((it, i) => {
        const blk = document.createElement("div") as HTMLElement & { _t?: HTMLElement; _sx?: number; _sy?: number };
        blk.className = "k-zblock";
        blk.style.cssText = `bottom:${it.y.toFixed(1)}px;height:${it.h.toFixed(1)}px;background:${ground};z-index:${n - i};display:none`;
        const t = document.createElement("div");
        t.className = "k-ztext";
        t.textContent = text;
        t.style.fontSize = `${base.toFixed(1)}px`;
        // caps span the whole block, baseline on its bottom edge; the block clips the descender
        const tS = it.h / (M.capR * base);
        t.style.bottom = `${(-M.blBotR * base * tS).toFixed(2)}px`;
        const ty = Math.min(it.h * 0.5, it.h);
        t.style.transform = `translateY(${ty.toFixed(1)}px) scaleX(${it.sx.toFixed(3)}) scaleY(${tS.toFixed(3)})`;
        blk._t = t; blk._sx = it.sx; blk._sy = tS;
        blk.appendChild(t);
        col.appendChild(blk);
        return blk;
      });
      h.stage.appendChild(col);
      seg.style.visibility = "hidden";

      // one block, then the next — never a single sweep
      built.forEach((blk, i) => later(() => {
        blk.style.display = "block";
        void blk.offsetWidth; // flush layout so the rise actually animates
        blk._t!.style.transform = `translateY(0px) scaleX(${blk._sx!.toFixed(3)}) scaleY(${blk._sy!.toFixed(3)})`;
      }, i * STAGGER));

      active = col;
    }

    onResize = close;
  }

  /* ---------------- 3. COLUMN SCROLL ---------------- */
  function columns() {
    interface Col { el: HTMLElement; g: HTMLElement; cx: number; w: number; h: number; stretch: number; speed: number; range?: number; travel?: number; off?: number }
    let cols: Col[] = [];
    let running = false, mx = 0, my = 0, inside = false;

    function build() {
      h.cols.innerHTML = "";
      cols = [];
      const n = h.stage.clientWidth < 760 ? 3 : 5;
      const H = h.stage.clientHeight, W = h.stage.clientWidth, slotW = W / n;
      for (let i = 0; i < n; i++) {
        const w = slotW * range(0.42, 0.66);
        const x = slotW * i + range(0.08, 0.34) * slotW;
        const ch = H * range(0.5, 0.94);
        const fromTop = Math.random() < 0.6;
        const top = fromTop ? 0 : Math.max(H - ch - range(0, H * 0.06), 0);
        const el = document.createElement("div");
        el.className = `k-col${fromTop ? "" : " is-up"}`;
        el.style.cssText = `left:${x}px;top:${top}px;width:${w}px;height:${ch}px;background:${deal()}`;

        const g = document.createElement("div");
        g.className = "k-giant";
        g.textContent = `${TEXT} `.repeat(3); // always longer than the column can show
        g.style.fontSize = `${(w / range(3.0, 4.0)).toFixed(1)}px`;
        g.style.width = `${(w * 1.3).toFixed(0)}px`;
        g.style.left = `${(-w * range(0.08, 0.25)).toFixed(0)}px`;
        el.appendChild(g);
        h.cols.appendChild(el);
        cols.push({ el, g, cx: x + w / 2, w, h: ch, stretch: range(2.6, 3.4), speed: range(0.5, 1) });
      }
      raf(() => cols.forEach((c) => {
        c.range = Math.max(c.g.scrollHeight * c.stretch - c.h, 0);
        c.travel = Math.min(c.range, c.h * range(1.2, 2.2)); // cap the scroll or it races
        c.off = range(0, Math.max(c.range - c.travel, 0));
      }));
    }

    function frame() {
      const ny = clamp(my / h.stage.clientHeight, 0, 1);
      for (const c of cols) {
        const dx = Math.abs(mx - c.cx);
        const open = inside ? clamp(1 - (dx - c.w * 0.55) / 210, 0, 1) : 0;
        const pct = ((1 - open) * 100).toFixed(1);
        c.el.style.clipPath = c.el.classList.contains("is-up") ? `inset(${pct}% 0 0 0)` : `inset(0 0 ${pct}% 0)`;
        const ty = clamp((c.off ?? 0) + ny * (c.travel ?? 0) * c.speed, 0, c.range ?? 0);
        c.g.style.transform = `translateY(${(-ty).toFixed(1)}px) scaleY(${c.stretch.toFixed(2)})`;
      }
      if (running) raf(frame);
    }
    function start() { if (!running) { running = true; raf(frame); } }

    h.stage.addEventListener("pointermove", (e) => {
      const r = h.stage.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top; inside = true; start();
    }, sig());
    h.stage.addEventListener("pointerleave", () => {
      inside = false;
      later(() => { if (!inside) { running = false; frame(); } }, 400);
    }, sig());

    build();
    onResize = build;
  }

  /* ---------------- 4. PERIMETER ---------------- */
  function perimeter() {
    interface Rail { el: HTMLElement; run: HTMLElement; axis: "x" | "y"; dir: number; off: number; unit: number; hid: string }
    let rails: Rail[] = [];
    let v = 0, lx: number | null = null, ly = 0, running = false, shown = false;

    function build() {
      h.peri.innerHTML = "";
      rails = [];
      shown = false;
      const W = h.stage.clientWidth, H = h.stage.clientHeight;
      const d = [0.04, 0.075, 0.135, 0.215]
        .sort(() => Math.random() - 0.5)
        .map((r) => Math.round(clamp(H * r, 14, H * 0.26)));
      const [dT, dR, dB, dL] = d;
      const midH = H - dT - dB;
      const defs = [
        { axis: "x" as const, dir: -1, d: dT, css: `left:0;top:0;width:${W}px;height:${dT}px`, hid: `translateY(${-dT - 2}px)`, len: W },
        { axis: "y" as const, dir: -1, d: dR, css: `left:${W - dR}px;top:${dT}px;width:${dR}px;height:${midH}px`, hid: `translateX(${dR + 2}px)`, len: midH },
        { axis: "x" as const, dir: 1, d: dB, css: `left:0;top:${H - dB}px;width:${W}px;height:${dB}px`, hid: `translateY(${dB + 2}px)`, len: W },
        { axis: "y" as const, dir: 1, d: dL, css: `left:0;top:${dT}px;width:${dL}px;height:${midH}px`, hid: `translateX(${-dL - 2}px)`, len: midH },
      ];
      for (const def of defs) {
        const el = document.createElement("div");
        el.className = `k-rail${def.axis === "y" ? " is-v" : ""}`;
        el.style.cssText = `${def.css};background:${deal()};transform:${def.hid};transition:transform 250ms cubic-bezier(.1,.85,.2,1)`;
        const run = document.createElement("div");
        run.className = "k-run";
        run.textContent = `${TEXT}   `;
        el.appendChild(run);
        h.peri.appendChild(el);

        run.style.fontSize = "100px";
        const RM = faceMetrics(run);
        const fs = def.d / RM.capR; // cap height fills the rail depth
        run.style.fontSize = `${fs.toFixed(1)}px`;
        const inset = -(RM.blTopR - RM.capR) * fs;
        if (def.axis === "x") { run.style.left = "0"; run.style.top = `${inset.toFixed(1)}px`; }
        else { run.style.top = "0"; run.style.left = `${inset.toFixed(1)}px`; }

        const unit = def.axis === "x" ? run.scrollWidth : run.scrollHeight;
        run.textContent = `${TEXT}   `.repeat(Math.ceil((def.len + unit) / Math.max(unit, 1)) + 1);
        rails.push({ el, run, axis: def.axis, dir: def.dir, off: 0, unit: Math.max(unit, 1), hid: def.hid });
      }
    }

    function show(on: boolean) {
      if (on === shown) return;
      shown = on;
      rails.forEach((r, i) => {
        r.el.style.transitionDelay = `${on ? i * 55 : (rails.length - 1 - i) * 35}ms`;
        r.el.style.transform = on ? "none" : r.hid;
      });
    }
    function frame() {
      v *= 0.93;
      for (const r of rails) {
        const n = r.off + v * 0.5 * r.dir;
        r.off = ((n % r.unit) + r.unit) % r.unit; // JS % goes negative and empties the rail
        r.run.style.transform = r.axis === "x" ? `translateX(${(-r.off).toFixed(1)}px)` : `translateY(${(-r.off).toFixed(1)}px)`;
      }
      if (Math.abs(v) > 0.04) raf(frame); else running = false;
    }

    h.stage.addEventListener("pointerenter", () => show(true), sig());
    h.stage.addEventListener("pointermove", (e) => {
      const r = h.stage.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (lx !== null) v = clamp(v + Math.hypot(x - lx, y - ly) * 0.5, -70, 70);
      lx = x; ly = y;
      if (!running) { running = true; raf(frame); }
    }, sig());
    h.stage.addEventListener("pointerleave", () => { lx = null; show(false); }, sig());

    build();
    onResize = build;
  }

  /* ---------------- 5. PANEL SPLIT ---------------- */
  function panels() {
    interface Pan { el: HTMLElement; f: HTMLElement; w100?: number; capR?: number; blTopR?: number }
    let pans: Pan[] = [];
    let N = 5, running = false, inside = false;

    function build() {
      h.panels.innerHTML = "";
      pans = [];
      h.panels.classList.remove("is-in");
      N = h.stage.clientWidth < 760 ? 3 : 5;
      for (let i = 0; i < N; i++) {
        const p = document.createElement("div");
        p.className = "k-pan";
        p.style.cssText = `flex-grow:1;background:${deal()}`;
        const f = document.createElement("div");
        f.className = "k-fill";
        f.textContent = WORDS[rnd(WORDS.length)];
        const nm = document.createElement("div");
        nm.className = "k-pn";
        nm.textContent = `P${String(i + 1).padStart(2, "0")}`;
        p.append(f, nm);
        h.panels.appendChild(p);
        pans.push({ el: p, f });
      }
      // measure each word once, so per-frame sizing is arithmetic with no layout reads
      raf(() => {
        for (const p of pans) {
          p.f.style.transform = "none";
          p.f.style.fontSize = "100px";
          p.w100 = p.f.getBoundingClientRect().width || 1;
          const M = faceMetrics(p.f);
          p.capR = M.capR; p.blTopR = M.blTopR;
        }
        tick();
      });
    }
    function tick() {
      const H = h.stage.clientHeight;
      const ws = pans.map((p) => p.el.clientWidth);
      pans.forEach((p, i) => {
        const w = ws[i];
        if (!w || !p.w100 || !p.capR || p.blTopR === undefined) return;
        const fs = ((w * 1.08) / p.w100) * 100;
        const sy = H / (p.capR * fs); // caps fill the panel, no dead space
        p.f.style.fontSize = `${fs.toFixed(1)}px`;
        p.f.style.left = `${(-w * 0.04).toFixed(1)}px`;
        p.f.style.top = `${(-(p.blTopR - p.capR) * fs * sy).toFixed(1)}px`;
        p.f.style.transform = `scaleY(${sy.toFixed(3)})`;
      });
    }
    function loop() { tick(); if (running) raf(loop); }
    function start() { if (!running) { running = true; raf(loop); } }

    h.stage.addEventListener("pointerenter", () => {
      inside = true;
      h.panels.classList.add("is-in");
      pans.forEach((p, i) => { p.el.style.transitionDelay = `${i * 45}ms`; });
      start();
    }, sig());
    h.stage.addEventListener("pointermove", (e) => {
      const r = h.stage.getBoundingClientRect();
      const k = clamp(Math.floor(clamp((e.clientX - r.left) / r.width, 0, 1) * N), 0, N - 1);
      pans.forEach((p, i) => { p.el.style.flexGrow = i === k ? "3.2" : "0.7"; });
      inside = true; start();
    }, sig());
    h.stage.addEventListener("pointerleave", () => {
      inside = false;
      h.panels.classList.remove("is-in");
      pans.forEach((p, i) => {
        p.el.style.transitionDelay = `${(pans.length - 1 - i) * 30}ms`;
        p.el.style.flexGrow = "1";
      });
      later(() => { if (!inside) running = false; }, 420);
    }, sig());

    build();
    onResize = build;
  }

  /* ---------------- 6. SCRAMBLE TILES ---------------- */
  function scramble() {
    const RADIUS = 150, TICK = 70;
    interface Unit { el: HTMLElement; word: number }
    interface Tile { el: HTMLElement; from: number; to: number; die: number }
    const units: Unit[] = [];
    const covered = new Set<number>();
    let tiles: Tile[] = [];
    let mx = -9999, my = -9999, inside = false, running = false, lastTick = 0;

    // one span per non-space character; spaces stay text nodes so wrapping still works
    h.intro.innerHTML = "";
    let word = 0;
    for (const ch of TEXT) {
      if (ch === " ") { h.intro.appendChild(document.createTextNode(" ")); word++; continue; }
      const sp = document.createElement("span");
      sp.textContent = ch;
      h.intro.appendChild(sp);
      units.push({ el: sp, word });
    }

    function spawn(start: number) {
      let span = 1;
      if (Math.random() < 0.34) span++;
      if (Math.random() < 0.14) span++;
      const w = units[start].word;
      let end = start;
      for (let k = 1; k < span; k++) {
        const n = start + k;
        if (n >= units.length || units[n].word !== w || covered.has(n)) break;
        end = n;
      }
      for (let k = start; k <= end; k++) if (covered.has(k)) return;

      const tile = document.createElement("span");
      tile.className = "k-tile";
      tile.style.background = deal();
      tile.style.width = `${range(0.55, 1.15).toFixed(2)}em`; // independent of what it replaces
      const g = document.createElement("span");
      g.className = "k-tg";
      g.textContent = pick(SYMBOLS);
      g.style.fontSize = "1.3em";
      tile.appendChild(g);

      units[start].el.parentNode!.insertBefore(tile, units[start].el);
      for (let k = start; k <= end; k++) { units[k].el.style.display = "none"; covered.add(k); }
      tiles.push({ el: tile, from: start, to: end, die: performance.now() + 220 + Math.random() * 380 });
    }
    function heal(t: Tile) {
      t.el.remove();
      for (let k = t.from; k <= t.to; k++) { units[k].el.style.display = ""; covered.delete(k); }
    }
    // positions move every time a tile lands, so measure fresh each tick
    function candidates() {
      const base = h.intro.getBoundingClientRect();
      const out: { i: number; t: number }[] = [];
      for (let i = 0; i < units.length; i++) {
        if (covered.has(i)) continue;
        const r = units[i].el.getBoundingClientRect();
        if (r.width <= 0) continue;
        const d = Math.hypot(r.left - base.left + r.width / 2 - mx, r.top - base.top + r.height / 2 - my);
        if (d < RADIUS) out.push({ i, t: 1 - d / RADIUS });
      }
      return out;
    }
    function frame() {
      const now = performance.now();
      for (let i = tiles.length - 1; i >= 0; i--) {
        if (now > tiles[i].die) { heal(tiles[i]); tiles.splice(i, 1); }
      }
      if (inside && now - lastTick > TICK) {
        lastTick = now;
        const cands = candidates().sort((a, b) => b.t - a.t);
        const n = Math.min(3, Math.ceil(cands.length * 0.12));
        for (let k = 0; k < n && cands.length; k++) {
          const j = Math.floor(Math.pow(Math.random(), 1.8) * cands.length);
          spawn(cands[j].i);
          cands.splice(j, 1);
        }
      }
      if (!inside && tiles.length === 0) { running = false; return; } // idle: stop burning frames
      raf(frame);
    }
    function start() { if (!running) { running = true; raf(frame); } }

    h.intro.addEventListener("pointermove", (e) => {
      const b = h.intro.getBoundingClientRect();
      mx = e.clientX - b.left; my = e.clientY - b.top; inside = true; start();
    }, sig());
    h.intro.addEventListener("pointerleave", () => { inside = false; mx = my = -9999; }, sig());
  }

  /* ---------------- 7. REWRITE ON HOVER ---------------- */
  function rewrite() {
    const idx = SEGMENTS.map(() => 0);
    const fired = SEGMENTS.map(() => 0);
    const colour = SEGMENTS.map(() => deal());
    let lastAny = 0;

    h.intro.innerHTML = "";
    const nodes = SEGMENTS.map((seg, i) => {
      const el = document.createElement("span");
      el.className = "k-seg";
      el.textContent = seg[0];
      el.tabIndex = 0;
      const go = () => advance(i);
      el.addEventListener("pointerenter", go, sig());
      el.addEventListener("focus", go, sig());
      h.intro.appendChild(el);
      h.intro.appendChild(document.createTextNode(" "));
      return el;
    });

    function advance(i: number) {
      /* swapping reflows the line, which slides the segment out from under a still
         cursor and fires pointerenter again — without these guards it cycles every
         alternate at once */
      const now = performance.now();
      if (now - fired[i] < 600) return;
      if (now - lastAny < 200) return;
      fired[i] = now;
      lastAny = now;
      idx[i] = (idx[i] + 1) % SEGMENTS[i].length;
      nodes[i].textContent = SEGMENTS[i][idx[i]];
      nodes[i].style.background = colour[i]; // an edited phrase keeps its box
      nodes[i].dataset.edited = "true";
    }
  }

  const MECHANICS: [string, () => void][] = [
    ["Grid cell flip", grid],
    ["Zoom stack", zoom],
    ["Column scroll", columns],
    ["Perimeter", perimeter],
    ["Panel split", panels],
    ["Scramble tiles", scramble],
    ["Rewrite on hover", rewrite],
  ];

  let currentIndex = -1;

  function roll() {
    teardown();
    ac = new AbortController();
    let i = rnd(MECHANICS.length);
    if (i === currentIndex) i = (i + 1) % MECHANICS.length;
    currentIndex = i;
    MECHANICS[i][1]();
  }

  let resizeTimer: number | undefined;
  const handleResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => onResize?.(), 160);
  };
  window.addEventListener("resize", handleResize);

  roll();
  void document.fonts?.ready.then(() => onResize?.());

  return {
    reroll: roll,
    current: () => (currentIndex < 0 ? "" : MECHANICS[currentIndex][0]),
    destroy() {
      teardown();
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    },
  };
}
