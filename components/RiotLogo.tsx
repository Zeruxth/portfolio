"use client";

import { useEffect, useRef } from "react";

/**
 * The Blooming Riot mark built from its parts (Figma 2210:2136, the logo
 * Instagram post): two rounded squares and a leaf sit apart and drift into
 * place; a line draws across each gap between them, the joins fill in
 * straight, and then the straight joins bend into the logo's rounded
 * corners. Then its construction draws itself over it: the guide lines, then
 * the circles. It holds, the drawing lifts off, and the mark comes apart the
 * way it came together, since it isn't made to last.
 *
 * Everything is in the post's own 472.5 units on its grey; the square scales
 * to fit the tile's height.
 */
const SIZE = 472.5;
const GROUND = "#C6C6C6";
const INK = "#F5F7F5";
const LINE = "#D1E3D5";
const RING = "#CDFF54";

/** the logo's frame in the post */
const AT = { x: 52.4958, y: 85.954 };
const LOGO =
  "M25.0501 143.331H53.8205C59.943 142.648 81.2232 139.001 95.5382 126.089C109.482 113.512 106.902 87.6542 106.811 76.2336C106.807 75.8314 106.803 75.4959 106.799 75.261C106.49 66.7344 107.113 53.0304 113.022 37.6601C116.878 27.6296 121.837 19.8778 126.007 14.3919L212.431 79.9808C244.137 104.043 256.454 144.155 246.691 180.356C246.701 180.346 246.712 180.337 246.723 180.327C245.244 188.701 244.974 194.604 250.72 201.167C258.385 209.921 272.231 213.528 279.861 214.881H322.448C328.335 214.881 333.108 219.654 333.108 225.541V292.922C333.108 298.81 328.335 303.582 322.448 303.582H255.066C249.179 303.582 244.407 298.81 244.407 292.922V237.72C243.304 230.243 239.928 220.919 230.662 212.992C183.602 177.744 149.855 152.319 141.052 144.856C139.949 143.921 136.81 141.2 132.243 140.698C127.969 140.228 122.539 142.143 114.317 149.375C107.455 155.41 104.528 163.061 103.393 169.983V221.674C103.393 227.561 98.6209 232.333 92.7339 232.333H25.0501C19.1631 232.333 14.3906 227.561 14.3906 221.674V153.99C14.3906 148.103 19.1631 143.331 25.0501 143.331Z";

/** the logo as a list of cubics from its start, so it can be bent */
type Pt = [number, number];
type Seg = [Pt, Pt, Pt];
const LOGO_START: Pt = [25.0501, 143.331];
const LOGO_SEGS: Seg[] = (() => {
  const segs: Seg[] = [];
  let at = LOGO_START;
  const line = (to: Pt) => {
    segs.push([
      [at[0] + (to[0] - at[0]) / 3, at[1] + (to[1] - at[1]) / 3],
      [at[0] + ((to[0] - at[0]) * 2) / 3, at[1] + ((to[1] - at[1]) * 2) / 3],
      to,
    ]);
    at = to;
  };
  for (const [, cmd, args] of LOGO.matchAll(/([MHVLCZ])([^MHVLCZ]*)/g)) {
    const n = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (cmd === "H") line([n[0], at[1]]);
    else if (cmd === "V") line([at[0], n[0]]);
    else if (cmd === "L") line([n[0], n[1]]);
    else if (cmd === "C") {
      segs.push([[n[0], n[1]], [n[2], n[3]], [n[4], n[5]]]);
      at = [n[4], n[5]];
    }
  }
  return segs;
})();

/**
 * The four joins, each from where it leaves one piece to where it meets the
 * next: the left square's top to the leaf, the leaf's lobe to the right
 * square's top, the right square's side to the lobe, and the leaf's underside
 * to the left square's side.
 */
const JOINS: [Pt, Pt][] = [
  [[53.8205, 143.331], [106.799, 75.261]],
  [[246.723, 180.327], [279.861, 214.881]],
  [[244.407, 237.72], [230.662, 212.992]],
  [[141.052, 144.856], [103.393, 169.983]],
];

/** the logo with every join pulled straight: the same cubics, laid along the line across the gap */
const STRAIGHT_SEGS: Seg[] = (() => {
  const near = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.01;
  const startOf = (k: number) => (k === 0 ? LOGO_START : LOGO_SEGS[k - 1][2]);
  const out = LOGO_SEGS.map((s) => s.map((p) => [...p]) as Seg);
  for (const [a, b] of JOINS) {
    const from = LOGO_SEGS.findIndex((_, k) => near(startOf(k), a));
    const to = LOGO_SEGS.findIndex((s) => near(s[2], b));
    // each anchor keeps its share of the way along the join
    const anchors = [startOf(from), ...LOGO_SEGS.slice(from, to + 1).map((s) => s[2])];
    const run = anchors.map((p, k) => (k ? Math.hypot(p[0] - anchors[k - 1][0], p[1] - anchors[k - 1][1]) : 0));
    const total = run.reduce((x, y) => x + y, 0);
    let walked = 0;
    const on = anchors.map((_, k) => {
      walked += run[k];
      const t = walked / total;
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] as Pt;
    });
    for (let k = from; k <= to; k++) {
      const p = on[k - from], q = on[k - from + 1];
      out[k] = [
        [p[0] + (q[0] - p[0]) / 3, p[1] + (q[1] - p[1]) / 3],
        [p[0] + ((q[0] - p[0]) * 2) / 3, p[1] + ((q[1] - p[1]) * 2) / 3],
        q,
      ];
    }
  }
  return out;
})();

/** the logo with its joins r of the way from straight (0) to rounded (1) */
const bent = (r: number) => {
  const m = (a: number, b: number) => (a + (b - a) * r).toFixed(3);
  return (
    `M${LOGO_START}` +
    LOGO_SEGS.map((s, k) => {
      const t = STRAIGHT_SEGS[k];
      return `C${m(t[0][0], s[0][0])} ${m(t[0][1], s[0][1])} ${m(t[1][0], s[1][0])} ${m(t[1][1], s[1][1])} ${m(t[2][0], s[2][0])} ${m(t[2][1], s[2][1])}`;
    }).join("") +
    "Z"
  );
};

/**
 * The leaf on its own, from the logo's own geometry: its upper edge runs from
 * the tip along the top guide and round the circle its lobe sits on; its lower
 * edge runs back up the lower guide to where that guide touches the circle the
 * tip's inner curve is drawn on, and follows that curve back to the tip.
 */
const LEAF = (() => {
  const tip = [126.007, 14.3919];
  const lobeFrom = [212.431, 79.9808];
  const lobeTo = [230.662, 212.992];
  const lobeR = 94.944;
  const inner = { x: 201.0926, y: 71.5513, r: 94.3666 };
  // the lower guide, from the lobe up towards the tip
  const dx = 141.052 - lobeTo[0], dy = 144.856 - lobeTo[1];
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  // where it touches the inner circle: the foot of the circle's centre on it
  const s = (inner.x - lobeTo[0]) * ux + (inner.y - lobeTo[1]) * uy;
  const foot = [lobeTo[0] + s * ux, lobeTo[1] + s * uy];
  return (
    `M${tip}L${lobeFrom}A${lobeR} ${lobeR} 0 0 1 ${lobeTo}` +
    `L${foot.map((v) => v.toFixed(3))}A${inner.r} ${inner.r} 0 0 1 ${tip}Z`
  );
})();

/** the two squares, as in the logo: 89 wide, corners on the small circles */
const SQUARES = [
  { x: 14.3906, y: 143.331, w: 89.0024, h: 89.0024 },
  { x: 244.407, y: 214.881, w: 88.701, h: 88.701 },
];
const CORNER = 10.66;
/** how far each piece starts from its place: the squares away from the leaf */
const APART = [
  { x: 0, y: -10 }, // leaf
  { x: -34, y: 14 },
  { x: 30, y: 26 },
];

/** the construction, in post units: four uprights and the leaf's two guides */
const DIAG = [0.793353, 0.608761]; // a vertical turned −52.5°
const HALF = 451.506 / 2;
const diag = (cx: number, cy: number) =>
  [cx - HALF * DIAG[0], cy - HALF * DIAG[1], cx + HALF * DIAG[0], cy + HALF * DIAG[1]];
const LINES = [
  [67.644, -14.407, 67.644, 437.099],
  [157.039, -14.407, 157.039, 437.099],
  diag(298.222, 190.931),
  [297.441, -14.407, 297.441, 437.099],
  diag(236.808, 263.593),
  [385.603, -14.407, 385.603, 437.099],
];
/** the circles: centre and radius, largest first */
const RINGS = [
  [259.559, 158.333, 99.563],
  [223.691, 233.388, 77.485],
  [334.614, 257.896, 42.088],
  [118.071, 181.833, 42.088],
  [195.743, 263.594, 40.453],
  [257.2, 329.233, 40.453],
  [320.041, 272.623, 21.814],
  [108.113, 206.53, 21.814],
  [184.111, 235.731, 9.503],
  [285.799, 317.588, 9.503],
  [78.215, 239.624, 10.57],
  [78.215, 307.056, 10.57],
  [145.91, 307.225, 10.57],
  [375.034, 312.222, 10.57],
  [308.018, 378.305, 10.57],
  [375.034, 378.305, 10.57],
];

/** the pieces only rest apart for a breath before they start to drift */
const APART_HOLD = 250;
/** the pieces drift in, the joins draw, fill and bend round */
const BOND = 4600;
/** the drawing starts this long before the joins have quite settled */
const DRAW_OVERLAP = 600;
const LINE_STAGGER = 140;
const LINE_DRAW = 1200;
/** the circles start this long after the first line */
const RINGS_AFTER = 700;
const RING_STAGGER = 70;
const RING_DRAW = 1300;
const HOLD = 2600;
/** the drawing lifts off */
const LIFT = 1100;
/** and the mark comes apart, starting while the drawing is still lifting */
const UNBOND = 3800;
const UNBOND_AFTER = 400;

const DRAWN = RINGS_AFTER + RING_STAGGER * (RINGS.length - 1) + RING_DRAW;
const AT_BOND = APART_HOLD;
const AT_DRAW = AT_BOND + BOND - DRAW_OVERLAP;
const AT_LIFT = AT_DRAW + DRAWN + HOLD;
const AT_UNBOND = AT_LIFT + UNBOND_AFTER;
const CYCLE = AT_UNBOND + UNBOND;

/** quintic: a long, soft start and a long, soft landing */
const ease = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2);
const clamp = (t: number) => Math.min(1, Math.max(0, t));
const span = (t: number, from: number, to: number) => clamp((t - from) / (to - from));
const f = (v: number) => v.toFixed(3);
/** smoothstep: for the fills, gentler than the moves */
const smooth = (t: number) => t * t * (3 - 2 * t);

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function RiotLogo() {
  const root = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = root.current;
    if (!svg) return;
    const pieces = [...svg.querySelectorAll<SVGElement>("[data-piece]")];
    const piecesGroup = svg.querySelector<SVGGElement>("[data-pieces]")!;
    const logo = svg.querySelector<SVGPathElement>("[data-logo]")!;
    const joins = [...svg.querySelectorAll<SVGLineElement>("[data-join]")];
    const lines = [...svg.querySelectorAll<SVGLineElement>("[data-line]")];
    const rings = [...svg.querySelectorAll<SVGCircleElement>("[data-ring]")];
    const drawing = svg.querySelector<SVGGElement>("[data-drawing]")!;

    /** b: 0 is the pieces apart, 1 the bonded logo */
    const bond = (b: number) => {
      // the pieces drift into place
      const near = ease(span(b, 0, 0.38));
      pieces.forEach((p, k) =>
        p.setAttribute("transform", `translate(${f(APART[k].x * (1 - near))} ${f(APART[k].y * (1 - near))})`),
      );
      // a line draws across each gap, one after another, as they settle
      joins.forEach((j, k) => j.setAttribute("stroke-dashoffset", f(1 - ease(span(b, 0.33 + k * 0.035, 0.49 + k * 0.035)))));
      // the joins fill in, straight, from the lines; the logo's path lies over
      // the pieces exactly, so only the joins show it arriving
      const fill = smooth(span(b, 0.5, 0.62));
      logo.setAttribute("opacity", f(fill));
      piecesGroup.setAttribute("display", fill < 1 ? "inline" : "none");
      // the lines go once the fill holds the edge, before it bends
      joins.forEach((j) => j.setAttribute("opacity", f(1 - smooth(span(b, 0.6, 0.64)))));
      // and the straight joins bend into the rounded corners
      logo.setAttribute("d", bent(ease(span(b, 0.62, 1))));
    };

    /** d: how far into the drawing, in ms */
    const draw = (d: number) => {
      lines.forEach((l, k) => l.setAttribute("stroke-dashoffset", f(1 - ease(span(d, k * LINE_STAGGER, k * LINE_STAGGER + LINE_DRAW)))));
      rings.forEach((r, k) => {
        const from = RINGS_AFTER + k * RING_STAGGER;
        r.setAttribute("stroke-dashoffset", f(1 - ease(span(d, from, from + RING_DRAW))));
      });
    };

    const frame = (t: number) => {
      const u = ((t % CYCLE) + CYCLE) % CYCLE;
      if (u < AT_UNBOND) bond(span(u, AT_BOND, AT_BOND + BOND));
      else bond(1 - span(u, AT_UNBOND, CYCLE));
      draw(u < AT_DRAW || u > AT_LIFT + LIFT ? 0 : u - AT_DRAW);
      drawing.setAttribute("opacity", f(1 - ease(span(u, AT_LIFT, AT_LIFT + LIFT))));
    };

    if (reduced()) {
      frame(AT_LIFT - 1);
      return;
    }

    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      frame(now - start);
      raf = requestAnimationFrame(tick);
    };
    frame(0);
    // every time it comes into view it starts over from the pieces apart
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
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, background: GROUND }}>
      <svg
        ref={root}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block", width: "100%", height: "100%", overflow: "hidden" }}
        role="img"
        aria-label="Blooming Riot logo"
      >
        <g fill={INK}>
          <g transform={`translate(${AT.x} ${AT.y})`}>
            <g data-pieces>
              <path data-piece d={LEAF} />
              {SQUARES.map((q, k) => (
                <rect key={k} data-piece x={q.x} y={q.y} width={q.w} height={q.h} rx={CORNER} />
              ))}
            </g>
            <path data-logo d={bent(0)} opacity={0} />
            {JOINS.map(([a, b], k) => (
              <line
                key={k}
                data-join
                x1={a[0]}
                y1={a[1]}
                x2={b[0]}
                y2={b[1]}
                stroke={INK}
                strokeWidth={1.5}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1}
              />
            ))}
          </g>
        </g>
        <g data-drawing fill="none" strokeWidth={1}>
          {LINES.map(([x1, y1, x2, y2], k) => (
            <line key={k} data-line x1={x1} y1={y1} x2={x2} y2={y2} stroke={LINE} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} />
          ))}
          {RINGS.map(([cx, cy, r], k) => (
            // drawn from the top, clockwise
            <circle
              key={k}
              data-ring
              cx={cx}
              cy={cy}
              r={r}
              stroke={RING}
              transform={`rotate(-90 ${cx} ${cy})`}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
