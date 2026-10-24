"use client";

import { useEffect, useRef } from "react";
import s from "./IndexPosters.module.css";

/**
 * The INDEX Gallery posters, each built from its grid, in a loop:
 * grid → poster → grid → poster …
 *
 * First the three gallery posters (Figma Section 6, slides 114 → 108 → 115 →
 * 116 → 117 → 118), whose grids are the Figma vectors as they are; then the
 * six exhibition posters (slide 150), whose grids are their own boxes and
 * rectangles (title box, rows, info cells, photo strips) with the type left
 * out: read from the vectors for the three built in Figma, traced from the
 * prints for the three flat ones.
 *
 * Each grid draws itself in, line by line, as thin black outlines on the
 * tile's ground; then its poster settles over it in a held-frame dissolve,
 * holds, and dissolves away while the next grid draws. All of it in held
 * frames at ~15fps, like the other live tiles.
 */
interface Poster {
  src: string;
  /** the poster's width over its height */
  ratio: number;
  /** the grid's box, mapped onto the poster's edges */
  vb: string;
  /** line weight, in the grid's units */
  stroke: number;
  /** drawn in this order */
  shapes: { x?: number; y?: number; d: string }[];
}

/** a box, as a path, so every line draws the same way */
const box = (x: number, y: number, w: number, h: number) => ({
  d: `M${x} ${y}H${+(x + w).toFixed(2)}V${+(y + h).toFixed(2)}H${x}Z`,
});
const line = (d: string) => ({ d });

/** the gallery posters sit in the Figma tile's 277.54 × 388.52 box */
const GALLERY = 277.544 / 388.524;
/** the gallery grids are drawn around their outline's render box: half a stroke in */
const gvb = (w: number, h: number) => `0.75 0.75 ${w - 1.5} ${h - 1.5}`;
/** a hairline, like the posters' own grid lines (0.74 in the 285-wide exhibition
 * posters), a touch finer since black on the pale ground reads heavier */
const EX = 0.6;
const GL = EX * (488 / 285);

const POSTERS: Poster[] = [
  {
    src: "1.jpg",
    ratio: GALLERY,
    vb: gvb(483.852, 683.534),
    stroke: GL,
    shapes: [
      { d: "M0.75 337.013V414.303M483.103 229.977V152.636M483.103 561.96V480.324M483.103 682.783V0.75H56.1171H0.75V71.9253V658.709V682.783H156.395H483.103Z" },
      { x: -0.543, y: -0.543, d: "M451.005 42.2779L443.167 116.933L0.748456 70.4997L0.748192 0.749526L55.3277 0.750256L451.005 42.2779Z" },
      { x: 24.516, y: 152.635, d: "M459.129 0.864575L459.129 76.6908L11.4585 140.586L0.848483 66.2747L459.129 0.864575Z" },
      { x: -0.543, y: 337.014, d: "M452.521 63.1524L442.265 137.514L0.74964 76.6361L0.749811 0.860482L452.521 63.1524Z" },
      { x: -0.539, y: 480.648, d: "M484.219 1.07737L484.079 81.1655L156.241 202.408L0.74933 202.677L0.789507 179.861L484.219 1.07737Z" },
    ],
  },
  {
    src: "2.jpg",
    ratio: GALLERY,
    vb: gvb(483.5, 683.5),
    stroke: GL,
    shapes: [
      { d: "M0.75 336.997V414.283M0.75 414.283V383.968M0.75 414.283V532.441M482.75 561.932V480.301M482.75 421.005V377.872M482.75 251.126L482.75 229.966V152.628L482.75 100.165M0.75 658.677V682.75H111.805H156.281H482.75V599.451L482.75 0.75H224.519H56.0766H0.75V65.5623V71.9218V658.677Z" },
      { x: -0.289, y: -0.149, d: "M483.204 100.52L483.256 152.53L483.331 229.957L483.352 250.048L0.812193 64.3726L0.747861 0.749893L55.5375 0.804546L224.49 0.970107L483.204 100.52Z" },
      { x: -0.156, y: 277.124, d: "M460.777 0.899499L483.751 100.321L483.729 142.877L0.751643 254.482L0.810357 136.977L0.825518 107.184L460.777 0.899499Z" },
      { x: 58.754, y: 535.486, d: "M0.857752 138.607L22.8979 0.85922L424.242 65.0757L424.233 147.049L98.3272 147.087L53.8854 147.092L0.857752 138.607Z" },
    ],
  },
  {
    src: "3.jpg",
    ratio: GALLERY,
    vb: gvb(487.5, 688.5),
    stroke: GL,
    shapes: [
      { d: "M0.75 339.462V417.315M0.75 417.315V386.778M0.75 417.315V536.339M486.75 566.046V483.816M486.75 424.086V380.636M486.75 252.961L486.75 231.647V153.742L486.75 100.894M0.75 663.5V687.75H112.726H157.572H486.75V603.84L486.75 0.75H226.376H56.5358H0.75V66.0375V72.4436V663.5Z" },
      { x: 46.043, y: 75.48, d: "M0.75 64.3828V79.0089M0.75 79.0089V73.2719M0.75 79.0089V101.37M46.7935 106.951V91.5023M46.7935 80.2809V72.1182M46.7935 48.1322L46.7935 44.1279V29.4921L46.7935 19.5638M0.75 125.259V129.815H11.3586H15.6073H46.7935V114.051L46.7935 0.75H22.1258H6.03513H0.75V13.0154V14.2189V125.259Z" },
      { x: 366.348, y: 252.569, d: "M0.75 29.1548V22.8055M0.75 22.8055V25.2959M0.75 22.8055V13.0985M87.8324 10.6757V17.382M87.8324 22.2533V25.7968M87.8324 36.2093L87.8324 37.9476V44.3011L87.8324 48.6111M0.75 2.72789V0.750227H20.8141H28.8497H87.8324V7.59345L87.8324 56.7783H41.1781H10.7458H0.75V51.4538V50.9314V2.72789Z" },
      { x: 90.086, y: 450.669, d: "M0.75 37.2701V29.1068M0.75 29.1068V32.3088M0.75 29.1068V16.6264M305.038 13.5114V22.1337M305.038 28.3968V32.9527M305.038 46.3402V48.5752V56.744V62.2854M0.75 3.29273V0.750016H70.8591H98.9374H305.038V9.54845V72.7861H142.016H35.6778H0.75V65.9403V65.2686V3.29273Z" },
    ],
  },
  // the exhibition posters, in the slide's 285-wide units
  {
    // orange, three photo strips under the grid (traced)
    src: "4.jpg",
    ratio: 285 / 398,
    vb: "0 0 285 398",
    stroke: EX,
    shapes: [
      box(0, 0, 285, 398),
      box(11.8, 13.8, 260.8, 371.3),
      line("M11.8 46.9H272.6M11.8 180.6H272.6"),
      line("M11.8 291.2H272.6M11.8 338.1H272.6M96 338.1V385.1M184.4 338.1V385.1"),
      line("M0 0H84L285 74.5V89.2L266.5 138.2L0 41.5Z"),
      line("M0 220.8L269.8 161.8L282.8 226.8L0 289.8Z"),
      line("M45.5 297L285 333V398H258.2L36.2 363.2Z"),
    ],
  },
  {
    // the full-bleed photo (traced)
    src: "5.jpg",
    ratio: 285 / 398,
    vb: "0 0 285 398",
    stroke: EX,
    shapes: [
      box(0, 0, 285, 398),
      box(11.4, 13.8, 261, 33.1),
      box(11.4, 66, 261, 206.1),
      box(11.4, 291.2, 261, 93.9),
      line("M11.4 338.1H272.4M95.8 338.1V385.1M184 338.1V385.1"),
    ],
  },
  {
    // the pale one, a photo in the grid (traced)
    src: "6.jpg",
    ratio: 285 / 398,
    vb: "0 0 285 398",
    stroke: EX,
    shapes: [
      box(0, 0, 285, 398),
      box(12.1, 13.9, 260.8, 371.2),
      line("M12.1 47.2H272.9M12.1 126.4H272.9M12.1 338.1H272.9"),
      line("M128.6 47.2V126.4M128.6 68.6H272.9M128.6 90.1H272.9M201.7 90.1V126.4"),
      line("M71.9 126.4V338.1"),
      box(79.5, 134.5, 184.5, 196.3),
    ],
  },
  {
    // blue, the photo in three stepped bars (Group 156 + 68)
    src: "7.jpg",
    ratio: 284 / 414,
    vb: "0 0 284 414",
    stroke: EX,
    shapes: [
      box(0, 0, 284, 414),
      box(17, 16, 250, 286),
      box(17.02, 16.45, 250.15, 21.55),
      box(17.02, 16.45, 250.15, 143.51),
      box(17, 301, 249.85, 48.35),
      line("M17 348.69H266.85V397H17ZM100.54 348.69V397M182.86 348.69V397"),
      line("M111.14 7.89H174.32V40.44H235.58V381.22H172.4V348.67H111.14V406.11H47.96V65.33H111.14Z"),
    ],
  },
  {
    // pale, the photo at the foot (Group 105)
    src: "8.jpg",
    ratio: 284.5 / 414.46,
    vb: "0 0 284.5 414.46",
    stroke: EX,
    shapes: [
      box(0, 0, 284.5, 414.46),
      box(17.11, 16.49, 250.39, 135.58),
      line("M75.8 16.55V151.39"),
      box(17.1, 151.46, 250.24, 48.29),
      line("M17.1 199.09H267.5V247.34H17.1ZM100.16 199.09V247.34M183.22 199.09V247.34"),
      box(19.55, 255.28, 247.95, 141.69),
    ],
  },
  {
    // blue, the photo at the head (Group 154)
    src: "9.jpg",
    ratio: 285 / 415,
    vb: "0 0 285 415",
    stroke: EX,
    shapes: [
      box(0, 0, 285, 415),
      box(17.13, 15.91, 250.84, 274.09),
      box(17.13, 15.91, 250.84, 22.02),
      box(17.13, 145.61, 250.84, 144.38),
      box(17.13, 303.45, 250.69, 48.38),
      line("M17.13 351.17H267.97V399.5H17.13ZM100.34 351.17V399.5M183.54 351.17V399.5"),
      box(17.13, 15.91, 250.84, 167.63),
    ],
  },
];

/** each line takes this long to draw; the next starts a little after, all of
 * them within DRAW_SPAN however many there are */
const DRAW_MS = 1300;
const STAGGER_MS = 160;
const DRAW_SPAN = 800;
const GRID_HOLD_MS = 500;
/** the poster settles over its grid whole, and leaves the same way */
const SETTLE_MS = 600;
const POSTER_HOLD_MS = 2600;
/** ~15fps, the held-frame rate of the other tiles */
const FPS = 15;

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const HELD = "steps(1, end)";
/** quintic in and out: slow off the mark, slow into place */
const ease = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2);

/** a property tweened from a to b, eased, in held frames */
function held(prop: "opacity" | "strokeDashoffset", a: number, b: number, ms: number): Keyframe[] {
  const n = Math.max(2, Math.round((ms / 1000) * FPS));
  return Array.from({ length: n + 1 }, (_, f) => ({
    [prop]: +(a + (b - a) * ease(f / n)).toFixed(3),
    offset: f / n,
    easing: HELD,
  }));
}
const drawIn = held("strokeDashoffset", 1, 0, DRAW_MS);
/** rubbed out along the way it was drawn */
const drawOut = held("strokeDashoffset", 0, -1, DRAW_MS);
const settleIn = held("opacity", 0, 1, SETTLE_MS);
const settleOut = held("opacity", 1, 0, SETTLE_MS);

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const vbox = (vb: string) => {
  const [x, y, width, height] = vb.split(" ").map(Number);
  return { x, y, width, height };
};

type Pt = [number, number];

/** a shape's outline as straight segments, its offset applied */
function segments({ x = 0, y = 0, d }: Poster["shapes"][number]): [Pt, Pt][] {
  const tok = d.match(/[MLHVZ]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi) ?? [];
  const out: [Pt, Pt][] = [];
  let cmd = "M";
  let cur: Pt = [0, 0];
  let start: Pt = [0, 0];
  const to = (p: Pt) => {
    if (p[0] !== cur[0] || p[1] !== cur[1]) out.push([cur, p]);
    cur = p;
  };
  for (let k = 0; k < tok.length; ) {
    if (/[a-z]/i.test(tok[k])) cmd = tok[k++].toUpperCase();
    if (cmd === "Z") {
      to(start);
      continue;
    }
    const n = (o = 0) => +tok[k + o];
    if (cmd === "M") {
      cur = start = [n() + x, n(1) + y];
      k += 2;
      cmd = "L";
    } else if (cmd === "L") (to([n() + x, n(1) + y]), (k += 2));
    else if (cmd === "H") (to([n() + x, cur[1]]), (k += 1));
    else if (cmd === "V") (to([cur[0], n() + y]), (k += 1));
    else k++;
  }
  return out;
}

/**
 * Each poster's lines with every edge drawn once, by the first shape that has
 * it. Shapes share edges (the bands run along the outline, boxes stack on one
 * left edge, some sit a fraction of a unit apart), and a hairline drawn twice,
 * or twice a hair apart, reads as one line of double weight.
 */
function lines(p: Poster): string[] {
  const tol = 0.8 * (vbox(p.vb).width / 285);
  const drawn: [Pt, Pt][] = [];
  const f = (v: number) => +v.toFixed(2);
  return p.shapes.map((sh) => {
    let d = "";
    for (const [a, b] of segments(sh)) {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < tol) continue;
      const u: Pt = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
      // what's left of this segment, as spans along it
      let left: [number, number][] = [[0, len]];
      for (const [c, e] of drawn) {
        const off = (q: Pt) => (q[0] - a[0]) * u[1] - (q[1] - a[1]) * u[0];
        if (Math.abs(off(c)) > tol || Math.abs(off(e)) > tol) continue;
        const along = (q: Pt) => (q[0] - a[0]) * u[0] + (q[1] - a[1]) * u[1];
        const lo = Math.min(along(c), along(e)) - tol / 2;
        const hi = Math.max(along(c), along(e)) + tol / 2;
        left = left.flatMap(([s0, s1]) =>
          [[s0, Math.min(s1, lo)], [Math.max(s0, hi), s1]].filter(([m, n]) => n - m > tol) as [number, number][],
        );
      }
      for (const [s0, s1] of left) {
        const p0: Pt = [a[0] + u[0] * s0, a[1] + u[1] * s0];
        const p1: Pt = [a[0] + u[0] * s1, a[1] + u[1] * s1];
        d += `M${f(p0[0])} ${f(p0[1])}L${f(p1[0])} ${f(p1[1])}`;
        drawn.push([p0, p1]);
      }
    }
    return d;
  });
}
const LINES = POSTERS.map(lines);

export default function IndexPosters() {
  const ref = useRef<HTMLDivElement>(null);
  const sheets = useRef<(HTMLDivElement | null)[]>([]);
  const posters = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const grid = (i: number) => sheets.current[i]?.querySelector("svg") ?? null;
    const strokes = (i: number) =>
      Array.from(grid(i)?.querySelectorAll<SVGPathElement>(`.${s.line}`) ?? []);
    if (reduced()) {
      // the first poster, still
      const p = posters.current[0];
      if (p) p.style.opacity = "1";
      const g = grid(0);
      if (g) g.style.visibility = "hidden";
      return;
    }

    const live = new Set<Animation>();
    /** run a keyframe animation, then keep its last frame as plain style
     * (written out: commitStyles keeps the frame before it, held frames) */
    const play = (el: Element, kf: Keyframe[], ms: number, delay = 0) => {
      const a = el.animate(kf, { duration: ms, delay, fill: "both" });
      const { offset: _o, easing: _e, ...last } = kf[kf.length - 1];
      live.add(a);
      a.finished
        .then(() => {
          const st = (el as HTMLElement).style;
          if (last.opacity !== undefined) st.opacity = String(last.opacity);
          if (last.strokeDashoffset !== undefined) st.strokeDashoffset = `${last.strokeDashoffset}px`;
          a.cancel();
        })
        .catch(() => {})
        .finally(() => live.delete(a));
      return a;
    };
    let alive = true;
    /** the next step once these have really finished, not after a timer that
     * can run ahead of the animations when frames come slowly */
    const done = (as: (Animation | null | undefined)[], fn: () => void) =>
      Promise.all(as.map((a) => a?.finished))
        .then(() => alive && fn())
        .catch(() => {});
    /** the grid under a settled poster is put away, so its outline (half
     * of it outside the poster's edge) doesn't frame the poster */
    const showGrid = (i: number, on: boolean) => {
      const g = grid(i);
      if (g) g.style.visibility = on ? "" : "hidden";
    };

    // start clean (a remount finds the last run's styles): no posters, only
    // the first grid, drawn, as the markup has it
    posters.current.forEach((p) => p && (p.style.opacity = "0"));
    sheets.current.forEach((sh, i) => {
      if (sh) sh.style.zIndex = "";
      showGrid(i, true);
      strokes(i).forEach((l) => (l.style.strokeDashoffset = i === 0 ? "0px" : ""));
    });

    let cur = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    /** the next step, kept while the tile is off screen */
    let pending: (() => void) | null = null;
    let running = false;
    const after = (ms: number, fn: () => void) => {
      pending = fn;
      if (running) timer = setTimeout(() => ((pending = null), fn()), ms);
    };

    /** the poster settles over its grid, all of it at once */
    const fill = () => {
      const p = posters.current[cur];
      // not loaded yet: wait for it rather than pop in half way
      if (p && !p.complete) return after(200, fill);
      done([p && play(p, settleIn, SETTLE_MS)], () => {
        showGrid(cur, false);
        after(POSTER_HOLD_MS, empty);
      });
    };

    /** and leaves its bare grid, which rubs out as the next draws */
    const empty = () => {
      showGrid(cur, true);
      const p = posters.current[cur];
      done([p && play(p, settleOut, SETTLE_MS)], () => after(0, swap));
    };

    const swap = () => {
      const was = cur;
      cur = (cur + 1) % POSTERS.length;
      const out = strokes(was);
      const stOut = Math.min(STAGGER_MS, DRAW_SPAN / Math.max(1, out.length - 1));
      const rubbed = out.map((l, k) => play(l, drawOut, DRAW_MS, k * stOut));
      // the new sheet over the old one, so its lines cross the old ones
      sheets.current.forEach((sh, k) => sh && (sh.style.zIndex = k === cur ? "1" : ""));
      const ls = strokes(cur);
      const st = Math.min(STAGGER_MS, DRAW_SPAN / Math.max(1, ls.length - 1));
      const drawing = ls.map((l, k) => play(l, drawIn, DRAW_MS, k * st));
      done([...rubbed, ...drawing], () => after(GRID_HOLD_MS, fill));
    };

    pending = fill;
    // runs only while on screen and the tab is in front: a hidden tab keeps
    // its timers but freezes its animations, and the two would drift apart
    let onScreen = false;
    const update = () => {
      const go = onScreen && !document.hidden;
      if (go && !running) {
        running = true;
        const next = pending;
        if (next) after(GRID_HOLD_MS, next);
      } else if (!go && running) {
        running = false;
        clearTimeout(timer);
      }
    };
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      update();
    });
    io.observe(root);
    document.addEventListener("visibilitychange", update);
    return () => {
      alive = false;
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
      clearTimeout(timer);
      live.forEach((a) => a.cancel());
    };
  }, []);

  return (
    <div
      ref={ref}
      className={s.stage}
      role="img"
      aria-label="INDEX Gallery posters, each drawn first as its grid"
    >
      {POSTERS.map((p, i) => {
        const src = `${BASE}/index-posters/${p.src}`;
        return (
          <div
            key={p.src}
            ref={(el) => {
              sheets.current[i] = el;
            }}
            className={s.sheet}
            style={{ aspectRatio: String(p.ratio) }}
          >
            <svg
              className={s.grid}
              viewBox={p.vb}
              preserveAspectRatio="none"
              style={{ strokeWidth: p.stroke }}
              aria-hidden
            >
              {LINES[i].map((d, k) =>
                d ? (
                  <path
                    key={k}
                    d={d}
                    pathLength={1}
                    className={s.line}
                    // the loop starts on the first grid, drawn
                    style={i === 0 ? { strokeDashoffset: 0 } : undefined}
                  />
                ) : null,
              )}
            </svg>
            <img
              ref={(el) => {
                posters.current[i] = el;
              }}
              className={s.poster}
              src={src}
              alt=""
              draggable={false}
              style={{ opacity: 0 }}
            />
          </div>
        );
      })}
    </div>
  );
}
