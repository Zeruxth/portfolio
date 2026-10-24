"use client";

import { useEffect, useId, useRef } from "react";
import { CAP, WORDS } from "./index-gallery-logo-art";

/**
 * The Index Gallery mark through all its versions (Figma 2224:1641, colours
 * 2224:1757, versions 2224:1832): stepped or square, filled or outlined, in
 * blue, orange and grey-blue. The stepped mark empties to its outline, the
 * rows slide into columns as the outline squares up, the fill comes back, and
 * it steps back out; every step also sweeps it into the next colour, so the
 * colours keep turning over and one loop shows each of the sixteen versions
 * once. Only the mark changes colour; the ground stays. Both versions stand
 * at the square's height, so the mark never grows or shrinks: only the rows
 * slide sideways.
 *
 * Every sweep runs right to left, the way the Hebrew and Arabic read, one row
 * after the other, so its edge is stepped like the mark.
 *
 * Everything is in the post's own 473 units; the square scales to the tile.
 */
const SIZE = 473;

const GROUND = "#F7F7F9";
/** the type inside a filled mark */
const KNOCK = "#FFFFFF";
const PALETTES = ["#2A58CD", "#E65126", "#DDE2EC", "#27375F"];

type Pt = [number, number];
/** the square (Figma's 208×137), centred in the post; its height is the
 * mark's height in both versions, its rows split midway between the lines */
const SQ = { l: 132.25, r: 340.25, t: 167.75, row1: 212.75, row2: 253.75, b: 304.75 };
/** the outline's twelve corners, stepped: Figma's Union path across, the
 * square's rows down */
const STEPPED: Pt[] = [
  [229.152, SQ.row1], [209.175, SQ.row1], [209.175, SQ.row2], [244.43, SQ.row2],
  [244.43, SQ.b], [35.2549, SQ.b], [35.2549, SQ.row2], [0, SQ.row2],
  [0, SQ.row1], [19.9775, SQ.row1], [19.9775, SQ.t], [229.152, SQ.t],
].map(([x, y]) => [x + 114.04, y]);
const SQ_X = [SQ.r, SQ.r, SQ.r, SQ.r, SQ.r, SQ.l, SQ.l, SQ.l, SQ.l, SQ.l, SQ.l, SQ.r];
/** which row moves each corner */
const X_ROW = [0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0, 0];

type Word = keyof typeof WORDS;
/** each word's right edge, stepped and square, from the Figma frames, and its
 * cap top, which stays where the square has it */
const TYPE = ([
  { word: "galeria", row: 0, stepped: 213, square: [193.39, 13.68] },
  { word: "index_he", row: 0, stepped: 115.14, square: [94.56, 13.24] },
  { word: "index", row: 1, stepped: 198, square: [192.96, 57.29] },
  { word: "gallery", row: 1, stepped: 98, square: [94.71, 55.87] },
  { word: "maarad", row: 2, stepped: 234, square: [193.56, 95.66] },
  { word: "fihris", row: 2, stepped: 115, square: [87.47, 95.66] },
] as { word: Word; row: number; stepped: number; square: Pt }[]).map((w) => ({
  ...w,
  stepped: w.stepped + 114.04,
  square: [w.square[0] + SQ.l, w.square[1] + SQ.t + CAP] as Pt,
}));
/** the three middle dots' centres */
const DOTS: { row: number; stepped: number; square: Pt }[] = [
  { row: 0, stepped: 131.81, square: [113.33, 22.83] },
  { row: 1, stepped: 116.78, square: [111.2, 67.6] },
  { row: 2, stepped: 135.78, square: [104.1, 108.81] },
].map((d) => ({
  row: d.row,
  stepped: d.stepped + 114.04,
  square: [d.square[0] + SQ.l, d.square[1] + SQ.t] as Pt,
}));
const DOT_R = 1.776;
/** Figma's 2px inside stroke: a 4px stroke clipped to the shape */
const STROKE = 4;

/** shape: 0 stepped, 1 square */
type Look = { shape: 0 | 1; filled: boolean; palette: number };
type Step = { kind: "hold"; ms: number; look: Look } | { kind: "turn"; ms: number; from: Look; to: Look };

const HOLD = 1100;
const TURN = 1900;
/** how far behind the row above each row's move or sweep starts, as a share of it */
const ROW_LAG = 0.14;

/** stepped filled, stepped outlined, square outlined, square filled, round
 * again; the colour moves on at every step and skips one more at the start
 * of each round, so in four rounds of four the colours and versions meet
 * every way once */
const STEPS: Step[] = (() => {
  const ORDER: Omit<Look, "palette">[] = [
    { shape: 0, filled: true },
    { shape: 0, filled: false },
    { shape: 1, filled: false },
    { shape: 1, filled: true },
  ];
  const looks: Look[] = Array.from({ length: 16 }, (_, k) => ({ ...ORDER[k % 4], palette: (k + Math.floor(k / 4)) % PALETTES.length }));
  return looks.flatMap((look, k) => [
    { kind: "hold" as const, ms: HOLD, look },
    { kind: "turn" as const, ms: TURN, from: look, to: looks[(k + 1) % looks.length] },
  ]);
})();
const CYCLE = STEPS.reduce((n, s) => n + s.ms, 0);

/** septic: a very long, soft start and a very long, soft landing */
const ease = (t: number) => (t < 0.5 ? 64 * t ** 7 : 1 - (-2 * t + 2) ** 7 / 2);
const clamp = (t: number) => Math.min(1, Math.max(0, t));
const span = (t: number, from: number, to: number) => clamp((t - from) / (to - from));
const f = (v: number) => v.toFixed(2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** row r's share of a move or sweep at t: top row first */
const rowT = (t: number, r: number) => ease(span(t, r * ROW_LAG, 1 - (2 - r) * ROW_LAG));

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function IndexGalleryLogo() {
  const root = useRef<SVGSVGElement>(null);
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    const svg = root.current;
    if (!svg) return;
    const layers = [0, 1].map((k) => {
      const g = svg.querySelector<SVGGElement>(`[data-layer="${k}"]`)!;
      return {
        g,
        shapes: [...svg.querySelectorAll<SVGPolygonElement>(`[data-shape="${k}"]`)],
        fill: g.querySelector<SVGPolygonElement>("[data-fill]")!,
        line: g.querySelector<SVGPolygonElement>("[data-line]")!,
        words: [...g.querySelectorAll<SVGPathElement>("[data-word]")],
        dots: [...g.querySelectorAll<SVGCircleElement>("[data-dot]")],
      };
    });
    const bands = [...svg.querySelectorAll<SVGRectElement>("[data-band]")];

    /** lays out both layers at m (0 stepped, 1 square, rows staggered) */
    const place = (m: number) => {
      const rt = [0, 1, 2].map((r) => rowT(m, r));
      // only the widths move; every corner keeps its height
      const pts = STEPPED.map(([x, y], k) => [lerp(x, SQ_X[k], rt[X_ROW[k]]), y]);
      const points = pts.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");
      for (const l of layers) {
        l.shapes.forEach((s) => s.setAttribute("points", points));
        l.words.forEach((w, k) => {
          const { row, stepped, square } = TYPE[k];
          w.setAttribute("transform", `translate(${f(lerp(stepped, square[0], rt[row]))} ${f(square[1])})`);
        });
        l.dots.forEach((d, k) => {
          const { row, stepped, square } = DOTS[k];
          d.setAttribute("cx", f(lerp(stepped, square[0], rt[row])));
          d.setAttribute("cy", f(square[1]));
        });
      }
      // the sweep's rows follow the mark's own rows
      const row1 = (pts[0][1] + pts[8][1]) / 2;
      const row2 = (pts[2][1] + pts[6][1]) / 2;
      const edges = [0, row1, row2, SIZE];
      bands.forEach((b, r) => {
        b.setAttribute("y", f(edges[r]));
        b.setAttribute("height", f(edges[r + 1] - edges[r]));
      });
    };

    const dress = (k: number, look: Look) => {
      const l = layers[k];
      const mark = PALETTES[look.palette];
      l.fill.setAttribute("fill", look.filled ? mark : "none");
      l.line.setAttribute("stroke", mark);
      const ink = look.filled ? KNOCK : mark;
      l.words.forEach((w) => w.setAttribute("fill", ink));
      l.dots.forEach((d) => d.setAttribute("fill", ink));
    };

    /** w: 0 shows only the lower layer, 1 the upper one, swept in from the right row by row */
    const sweep = (w: number, from: number, to: number) => {
      bands.forEach((b, r) => {
        const x = lerp(to, from, rowT(w, r));
        b.setAttribute("x", f(x));
        b.setAttribute("width", f(Math.max(0, to - x)));
      });
    };

    const frame = (t: number) => {
      let u = ((t % CYCLE) + CYCLE) % CYCLE;
      let k = 0;
      while (u >= STEPS[k].ms) u -= STEPS[k++].ms;
      const step = STEPS[k];
      const p = u / step.ms;
      if (step.kind === "hold") {
        dress(0, step.look);
        place(step.look.shape);
        layers[1].g.setAttribute("display", "none");
      } else {
        // the next version and colour sweep in while the rows move
        const { from, to } = step;
        dress(0, from);
        dress(1, to);
        place(from.shape === to.shape ? from.shape : from.shape === 0 ? p : 1 - p);
        layers[1].g.setAttribute("display", "inline");
        sweep(p, STEPPED[7][0] - 24, STEPPED[3][0] + 24);
      }
    };

    if (reduced()) {
      frame(0);
      return;
    }

    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      frame(now - start);
      raf = requestAnimationFrame(tick);
    };
    frame(0);
    // every time it comes into view it starts over from the blue stepped mark
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) {
        start = performance.now();
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(svg);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [id]);

  return (
    <div style={{ position: "absolute", inset: 0, background: GROUND }}>
      <svg
        ref={root}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ display: "block", width: "100%", height: "100%", overflow: "hidden" }}
        role="img"
        aria-label="Index Gallery logo in its versions and colours"
      >
        <defs>
          {[0, 1].map((k) => (
            <clipPath key={k} id={`${id}-shape${k}`}>
              <polygon data-shape={k} />
            </clipPath>
          ))}
          <clipPath id={`${id}-sweep`}>
            {[0, 1, 2].map((r) => (
              <rect key={r} data-band x={SIZE} y={0} width={0} height={0} />
            ))}
          </clipPath>
        </defs>
        {[0, 1].map((k) => (
          <g key={k} data-layer={k} clipPath={k === 1 ? `url(#${id}-sweep)` : undefined} display={k === 1 ? "none" : undefined}>
            {/* covers the layer below inside the sweep */}
            <rect width={SIZE} height={SIZE} fill={GROUND} />
            <polygon data-fill data-shape={k} />
            <polygon data-line data-shape={k} fill="none" strokeWidth={STROKE} clipPath={`url(#${id}-shape${k})`} />
            {TYPE.map(({ word }) => (
              <path key={word} data-word d={WORDS[word]} />
            ))}
            {DOTS.map((_, d) => (
              <circle key={d} data-dot r={DOT_R} />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}
