"use client";

import { useEffect, useId, useRef } from "react";
import { LOGO } from "./zoo-logo-art";
import s from "./ZooLogo.module.css";

/**
 * The Zoo Distillery logo cycling through its four variants (Figma 2136:2384)
 * inside the thumbnail scene (2145:6779): emblem → vertical → typographic →
 * horizontal → emblem.
 *
 * The variants share their parts, so it is one logo rearranging rather than
 * four images swapping: the griffin and the two words (מזקקת, זוּ) move to
 * where the next variant wants them; a part the next variant doesn't have
 * peels off where it stands, and a part it gains is stamped in at its place.
 * The oval grows out from around the griffin as it arrives and closes back
 * onto it when it leaves. Same vocabulary as the label animation — stamps and
 * peels — and the same stop-motion: every move is a few held
 * frames, not a tween.
 */
/** the emblem sits between the two variants that have a griffin, so the
 * griffin glides into and out of the oval rather than appearing from nothing */
const ORDER = ["emblem", "vert", "typo", "horiz"] as const;
type Layout = (typeof ORDER)[number];
type Piece = "griffin" | "mzk" | "zu" | "oval";
const PIECES: Piece[] = ["griffin", "mzk", "zu", "oval"];

const HOLD_MS = 1800;
const MOVE_MS = 800;
/** ~15fps: enough held frames for the easing to read, still stop-motion */
const MOVE_FRAMES = 12;
/** stamps land once the moves are under way */
const ENTER_DELAY = 350;

const INK = "#1d1d1d";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type M = readonly number[];
const layoutOf = (l: Layout) => LOGO.layouts[l] as Partial<Record<Piece, M>>;
const css = (m: M) => `matrix(${m.join(",")})`;
/** quintic: a long, soft start and a long, soft landing */
const ease = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2);
const easeOut = (t: number) => 1 - (1 - t) ** 5;
const easeIn = (t: number) => t ** 5;
const HELD = "steps(1, end)";

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** move: the matrix stepped from a to b, eased, a frame held at a time */
function move(a: M, b: M): Keyframe[] {
  return Array.from({ length: MOVE_FRAMES + 1 }, (_, f) => {
    const t = ease(f / MOVE_FRAMES);
    return { transform: css(a.map((v, i) => v + (b[i] - v) * t)), easing: HELD };
  });
}
/** stamp: lands off register and knocks into place */
/** an offset from the resting place: amount 1 is fully off register */
const off = (m: M, k: number, dir: 1 | -1) =>
  `${css(m)} translate(${(5 * k * dir).toFixed(2)}px, ${(-4 * k * dir).toFixed(2)}px) rotate(${(-1.5 * k * dir).toFixed(2)}deg)`;
const FX_FRAMES = 6;
/** fade up over the first part of an entrance, a held step at a time:
 * from a faint first frame to full by FADE_UNTIL of the way through */
const FADE_UNTIL = 0.8;
const fadeIn = (t: number) => Math.min(1, 0.15 + 0.85 * (1 - (1 - Math.min(1, t / FADE_UNTIL)) ** 2));
/** and down over the last part of an exit, gone on the final frame */
const FADE_FROM = 0.3;
const fadeOut = (t: number) => (t <= FADE_FROM ? 1 : Math.max(0, 1 - ((t - FADE_FROM) / (1 - FADE_FROM)) ** 1.5));
/** stamp: lands off register and settles in, easing out — the knock, then a soft finish */
const stamp = (m: M): Keyframe[] => [
  // hidden through the delay (fill: backwards shows this frame), then lands
  { transform: off(m, 1, 1), opacity: 0, easing: HELD },
  ...Array.from({ length: FX_FRAMES + 1 }, (_, f) => ({
    transform: off(m, 1 - easeOut(f / FX_FRAMES), 1),
    opacity: fadeIn(f / FX_FRAMES),
    offset: f === 0 ? 0.01 : f / FX_FRAMES,
    easing: HELD,
  })),
];
/** peel: barely moves, then is gone, easing in */
const peel = (m: M): Keyframe[] =>
  Array.from({ length: FX_FRAMES + 1 }, (_, f) => ({
    transform: off(m, easeIn(f / FX_FRAMES), -1),
    opacity: fadeOut(f / FX_FRAMES),
    offset: f / FX_FRAMES,
    easing: HELD,
  }));
/** the oval scaled about its own centre: k = 1 is its place in the emblem */
const ring = (k: number) => {
  const { rx, ry } = LOGO.oval;
  return `${css(LOGO.layouts.emblem.oval)} translate(${rx}px, ${ry}px) scale(${k.toFixed(3)}) translate(${-rx}px, ${-ry}px)`;
};
/** how small the ring is when it starts from, and shrinks back onto, the griffin */
const RING_FROM = 0.62;
const RING_FRAMES = 10;
/** the ring grows out from around the arriving griffin, easing out */
const ringIn: Keyframe[] = [
  { transform: ring(RING_FROM), opacity: 0, easing: HELD },
  ...Array.from({ length: RING_FRAMES + 1 }, (_, f) => ({
    transform: ring(RING_FROM + (1 - RING_FROM) * easeOut(f / RING_FRAMES)),
    opacity: fadeIn(f / RING_FRAMES),
    offset: f === 0 ? 0.01 : f / RING_FRAMES,
    easing: HELD,
  })),
];
/** and closes back onto it before it goes, easing in */
const ringOut: Keyframe[] = Array.from({ length: RING_FRAMES + 1 }, (_, f) => ({
  transform: ring(1 - (1 - RING_FROM) * easeIn(f / RING_FRAMES)),
  opacity: fadeOut(f / RING_FRAMES),
  offset: f / RING_FRAMES,
  easing: HELD,
}));

/**
 * Every time it comes into view it starts over from the emblem, stamped in,
 * so the cycle always opens on the stamp rather than wherever it was left.
 *
 * `scale` draws the logo smaller (or larger) about the centre of the scene,
 * for a tile that wants more room round it.
 */
export default function ZooLogo({ scale = 1 }: { scale?: number } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const edge = `${useId().replace(/[^a-zA-Z0-9]/g, "")}edge`;
  const els = useRef<Partial<Record<Piece, SVGGElement | null>>>({});

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let idx = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running = false;
    const live: Animation[] = [];

    /** settle every piece on a layout, no animation */
    const settle = (l: Layout) => {
      const lay = layoutOf(l);
      for (const p of ["griffin", "mzk", "zu"] as const) {
        const el = els.current[p];
        if (!el) continue;
        const m = lay[p];
        // a piece that has left keeps its last place, so it peels from there
        if (m) el.style.transform = css(m);
        el.style.opacity = m ? "1" : "0";
      }
      // the oval only ever has one place; it is just shown or not
      if (els.current.oval) els.current.oval.style.opacity = lay.oval ? "1" : "0";
    };

    const step = () => {
      const from = layoutOf(ORDER[idx]);
      idx = (idx + 1) % ORDER.length;
      const to = layoutOf(ORDER[idx]);
      if (reduced()) {
        settle(ORDER[idx]);
      } else {
        for (const p of PIECES) {
          const el = els.current[p];
          const a = from[p], b = to[p];
          if (!el || (!a && !b)) continue;
          if (p === "oval") {
            if (a && !b) live.push(el.animate(ringOut, { duration: 450, fill: "forwards" }));
            // opens as the griffin decelerates into the centre, not before it gets there
            else if (!a && b) live.push(el.animate(ringIn, { duration: 600, delay: MOVE_MS * 0.48, fill: "backwards" }));
            continue;
          }
          if (a && b) live.push(el.animate(move(a, b), { duration: MOVE_MS, fill: "forwards" }));
          else if (a) live.push(el.animate(peel(a), { duration: 380, fill: "forwards" }));
          else if (b) live.push(el.animate(stamp(b), { duration: 420, delay: ENTER_DELAY, fill: "backwards" }));
        }
        // the end state is the settled layout; the animations only get there
        settle(ORDER[idx]);
      }
      timer = setTimeout(() => {
        live.splice(0).forEach((x) => x.cancel());
        step();
      }, HOLD_MS + MOVE_MS);
    };

    /** back to the emblem, stamped in: the griffin knocks down, the ring grows round it */
    const enter = () => {
      live.splice(0).forEach((x) => x.cancel());
      idx = 0;
      const lay = layoutOf(ORDER[0]);
      settle(ORDER[0]);
      let lead = 0;
      if (!reduced()) {
        for (const p of ["griffin", "mzk", "zu"] as const) {
          const el = els.current[p], m = lay[p];
          if (el && m) live.push(el.animate(stamp(m), { duration: 420, fill: "backwards" }));
        }
        const oval = els.current.oval;
        if (oval && lay.oval) live.push(oval.animate(ringIn, { duration: 600, delay: 200, fill: "backwards" }));
        lead = 800;
      }
      timer = setTimeout(() => {
        live.splice(0).forEach((x) => x.cancel());
        step();
      }, lead + HOLD_MS);
    };

    settle(ORDER[0]);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) {
        running = true;
        enter();
      } else if (!e.isIntersecting && running) {
        running = false;
        clearTimeout(timer);
      }
    });
    io.observe(root);
    return () => {
      io.disconnect();
      clearTimeout(timer);
      live.forEach((x) => x.cancel());
    };
  }, []);

  const { rx, ry, sw } = LOGO.oval;
  // a wider window onto the same scene draws everything smaller, about the centre
  const view = LOGO.size / scale;
  const o = (LOGO.size - view) / 2;
  return (
    <div ref={ref} className={s.stage} aria-label="Zoo Distillery logo variations" role="img">
      <svg viewBox={`${o} ${o} ${view} ${view}`} preserveAspectRatio="xMidYMid slice">
        {/* The ink edge. In Figma the type and the griffin carry a textured brush
            stroke whose geometry doesn't export as anything a browser can draw,
            so the same rough, bleeding edge is made here: fine noise displacing
            only the outline. It sits in each piece's own coordinates, so the
            texture travels with the piece instead of crawling over it. */}
        <filter id={edge} x="-3%" y="-3%" width="106%" height="106%">
          <feTurbulence type="fractalNoise" baseFrequency="0.19" numOctaves={2} seed={7} />
          <feDisplacementMap in="SourceGraphic" scale="1.3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <rect x={o} y={o} width={view} height={view} fill="#f5f5f5" />
        {(["griffin", "mzk", "zu"] as const).map((p) => (
          <g
            key={p}
            ref={(el) => {
              els.current[p] = el;
            }}
            className={s.piece}
            style={{ transform: css(layoutOf("emblem")[p] ?? [1, 0, 0, 1, 0, 0]), opacity: layoutOf("emblem")[p] ? 1 : 0 }}
          >
            <path d={LOGO.paths[p]} fill={INK} stroke={INK} strokeWidth={LOGO.strokes[p]} filter={`url(#${edge})`} />
          </g>
        ))}
        <g
          ref={(el) => {
            els.current.oval = el;
          }}
          className={s.piece}
          style={{ transform: ring(1) }}
        >
          <ellipse
            cx={rx}
            cy={ry}
            rx={rx}
            ry={ry}
            fill="none"
            stroke={INK}
            strokeWidth={sw}
          />
        </g>
      </svg>
      <div className={s.paper} style={{ backgroundImage: `url("${BASE}/zoo-labels/paper.jpg")` }} />
    </div>
  );
}
