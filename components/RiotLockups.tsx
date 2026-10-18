"use client";

import { useEffect, useId, useRef } from "react";
import { RIOT_LOCKUPS, type Bracket, type Lockup } from "./riot-lockups-art";

/**
 * The two Blooming Riot lockups from the Instagram posts (Figma 2210:2270,
 * 2210:2293), one after the other, each in four beats:
 *
 * 1. the brackets sit closed, [] in the middle of the post;
 * 2. they open out to their places and the words come out from between them,
 *    set plain: every letter upright and regular;
 * 3. the letters turn into the Blooming Riot type one at a time: the oblique
 *    ones lean over, the constructed ones (the chained N and I, the cog O)
 *    melt into shape: the plain letter softens, runs into the new form like
 *    a drop finding its edges, and sets sharp again (a blur pulled through
 *    an alpha threshold, so the two shapes pool into each other rather than
 *    crossfade);
 * 4. the brackets close back over the words, and while closed they stretch
 *    or shrink to the next lockup's brackets, which then open.
 *
 * Everything is drawn in the posts' own 472.5 units on their grey; the
 * square scales to fit the tile's height.
 */
const { slant: SLANT, lockups: LOCKUPS } = RIOT_LOCKUPS;

const CLOSED = 900;
/** the first part of CLOSED, where the brackets take on the next lockup's size */
const RESIZE = 700;
const OPEN = 1400;
const PLAIN = 900;
/** one changing letter after another, left to right */
const STAGGER = 220;
/** how long a letter takes to lean over, or to melt into its new shape */
const LEAN = 900;
const FINAL = 2200;
/** how soft a melting letter gets at its softest, in post units (a stem is ~5) */
const MELT = 2.6;
const CLOSE = 1200;

const changing = (l: Lockup) => l.lines.flatMap((line) => line.glyphs).filter((g) => g.order !== undefined).length;
const changeLength = (l: Lockup) => STAGGER * (changing(l) - 1) + LEAN;
const lengthOf = (l: Lockup) => CLOSED + OPEN + PLAIN + changeLength(l) + FINAL + CLOSE;
const CYCLE = LOCKUPS.reduce((sum, l) => sum + lengthOf(l), 0);

const INK = "#F5F7F5";
const GROUND = "#C6C6C6";
const SIZE = 472.5;
/** room between the two brackets when they sit closed */
const GAP = 3;

/** quintic: a long, soft start and a long, soft landing */
const ease = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2);
const clamp = (t: number) => Math.min(1, Math.max(0, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const f = (v: number) => v.toFixed(3);

const leftD = (n: number[]) =>
  `M${f(n[0])} ${f(n[1])}H${f(n[2])}V${f(n[3])}H${f(n[4])}V${f(n[5])}H${f(n[6])}V${f(n[7])}H${f(n[8])}V${f(n[9])}Z`;
const rightD = (n: number[]) =>
  `M${f(n[0])} ${f(n[1])}H${f(n[2])}V${f(n[3])}H${f(n[4])}L${f(n[5])} ${f(n[6])}H${f(n[7])}V${f(n[8])}H${f(n[9])}L${f(n[10])} ${f(n[11])}Z`;

/** a bracket's own box: the left one is as wide as its arms, the right one starts at its lower arm */
const heightOf = (b: Bracket) => b.n[1];
const armOf = (b: Bracket) => b.n[0];

/** where the closed [] of a lockup puts each bracket */
function closedOf(l: Lockup) {
  return {
    lx: l.cx - GAP / 2 - armOf(l.left),
    ly: l.cy - heightOf(l.left) / 2,
    rx: l.cx + GAP / 2,
    ry: l.cy - heightOf(l.right) / 2,
  };
}

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function RiotLockups() {
  const root = useRef<SVGSVGElement>(null);
  const clipId = useId().replace(/:/g, "");

  useEffect(() => {
    const svg = root.current;
    if (!svg) return;
    const left = svg.querySelector<SVGPathElement>("[data-bracket=left]")!;
    const right = svg.querySelector<SVGPathElement>("[data-bracket=right]")!;
    const clip = svg.querySelector<SVGPolygonElement>("[data-clip]")!;
    const groups = [...svg.querySelectorAll<SVGGElement>("[data-lockup]")];
    const leans = groups.map((g) => [...g.querySelectorAll<SVGPathElement>("[data-lean]")]);
    const swaps = groups.map((g) =>
      [...g.querySelectorAll<SVGGElement>("[data-swap]")].map((el) => ({
        el,
        custom: el.querySelector<SVGGElement>("[data-custom]")!,
        plain: el.querySelector<SVGGElement>("[data-plain]")!,
        blur: svg.querySelector<SVGFEGaussianBlurElement>(`#${el.dataset.melt} feGaussianBlur`)!,
      })),
    );

    /** draws the cycle as it stands t ms in */
    const draw = (t: number) => {
      let i = 0;
      let u = ((t % CYCLE) + CYCLE) % CYCLE;
      while (u >= lengthOf(LOCKUPS[i])) u -= lengthOf(LOCKUPS[i++]);
      const l = LOCKUPS[i];
      const prev = LOCKUPS[(i + LOCKUPS.length - 1) % LOCKUPS.length];

      // the brackets' shape and closed place, eased over from the last lockup's
      const r = u < RESIZE ? ease(u / RESIZE) : 1;
      const ln = l.left.n.map((v, k) => lerp(prev.left.n[k], v, r));
      const rn = l.right.n.map((v, k) => lerp(prev.right.n[k], v, r));
      const a = closedOf(prev), b = closedOf(l);
      const closed = { lx: lerp(a.lx, b.lx, r), ly: lerp(a.ly, b.ly, r), rx: lerp(a.rx, b.rx, r), ry: lerp(a.ry, b.ry, r) };
      const cx = lerp(prev.cx, l.cx, r);

      // how far open: 0 is the closed [], 1 is the lockup
      const closeAt = lengthOf(l) - CLOSE;
      const o =
        u < CLOSED ? 0
        : u < CLOSED + OPEN ? ease((u - CLOSED) / OPEN)
        : u < closeAt ? 1
        : 1 - ease((u - closeAt) / CLOSE);

      const lx = lerp(closed.lx, l.left.x, o), ly = lerp(closed.ly, l.left.y, o);
      const rx = lerp(closed.rx, l.right.x, o), ry = lerp(closed.ry, l.right.y, o);
      left.setAttribute("d", leftD(ln));
      left.setAttribute("transform", `translate(${f(lx)} ${f(ly)})`);
      right.setAttribute("d", rightD(rn));
      right.setAttribute("transform", `translate(${f(rx)} ${f(ry)})`);

      // the words show between the brackets: the window opens from the middle
      // out to the inside of each bracket's stem (the right one slanted)
      const top = Math.min(ly, ry), bottom = Math.max(ly + ln[1], ry + rn[1]);
      const stemL = l.left.x + l.left.n[6];
      const n = l.right.n;
      const k = (n[5] - n[4]) / (n[6] - n[3]);
      const stemR = (y: number) => l.right.x + n[4] + k * (y - (l.right.y + n[3]));
      const xl = lerp(cx, stemL, o);
      clip.setAttribute(
        "points",
        `${f(xl)},${f(top)} ${f(lerp(cx, stemR(top), o))},${f(top)} ${f(lerp(cx, stemR(bottom), o))},${f(bottom)} ${f(xl)},${f(bottom)}`,
      );

      groups.forEach((g, j) => g.setAttribute("display", j === i ? "inline" : "none"));

      // the letters: plain until their turn comes
      const changeAt = CLOSED + OPEN + PLAIN;
      for (const el of leans[i]) {
        const s = ease(clamp((u - changeAt - Number(el.dataset.order) * STAGGER) / LEAN));
        const lean = SLANT * (1 - s);
        el.setAttribute("transform", `matrix(1 0 ${f(lean)} 1 ${f(-lean * Number(el.dataset.mid))} 0)`);
      }
      for (const { el, custom, plain, blur } of swaps[i]) {
        const m = ease(clamp((u - changeAt - Number(el.dataset.order) * STAGGER) / LEAN));
        const melting = m > 0 && m < 1;
        // sharp at either end, softest halfway
        if (melting) {
          el.setAttribute("filter", `url(#${el.dataset.melt})`);
          blur.setAttribute("stdDeviation", f(MELT * Math.sin(Math.PI * m)));
        } else el.removeAttribute("filter");
        custom.setAttribute("display", m > 0 ? "inline" : "none");
        plain.setAttribute("display", m < 1 ? "inline" : "none");
        custom.setAttribute("opacity", f(m));
        plain.setAttribute("opacity", f(1 - m));
      }
    };

    if (reduced()) {
      // the first lockup, finished
      draw(lengthOf(LOCKUPS[0]) - CLOSE - 1);
      return;
    }

    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      draw(now - start);
      raf = requestAnimationFrame(tick);
    };
    draw(0);
    // every time it comes into view it starts over from the closed brackets
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
        style={{ display: "block", width: "100%", height: "100%" }}
        role="img"
        aria-label={LOCKUPS.map((l) => l.label).join(" / ")}
      >
        <defs>
          <clipPath id={clipId}>
            <polygon data-clip points="0,0 0,0 0,0" />
          </clipPath>
        </defs>
        <g fill={INK} clipPath={`url(#${clipId})`}>
          {LOCKUPS.map((l, i) => (
            <g key={l.label} data-lockup={i} display={i ? "none" : "inline"}>
              {l.lines.map((line, j) => (
                <g key={j} transform={`translate(${line.x} ${line.y})`}>
                  {line.glyphs.map((g, k) =>
                    g.regular ? (
                      <g key={k} data-swap data-order={g.order} data-melt={`${clipId}-melt-${i}-${j}-${k}`}>
                        <filter id={`${clipId}-melt-${i}-${j}-${k}`} x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="0" />
                          {/* the threshold: soft edges set hard, so overlapping blurs pool */}
                          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 12 -5" />
                        </filter>
                        <g data-custom display="none">
                          <path d={g.d} />
                        </g>
                        <g data-plain>
                          <path d={g.regular.d} transform={g.regular.m && `matrix(${g.regular.m.join(" ")})`} />
                        </g>
                      </g>
                    ) : g.lean ? (
                      <path key={k} data-lean data-order={g.order} data-mid={line.mid} d={g.d} />
                    ) : (
                      <path key={k} d={g.d} />
                    ),
                  )}
                </g>
              ))}
              {l.text && (
                <text
                  x={l.text.x}
                  y={l.text.y}
                  fontSize={l.text.size}
                  fontFamily='Helvetica, "Helvetica Neue", Arial, sans-serif'
                >
                  {l.text.value}
                </text>
              )}
            </g>
          ))}
        </g>
        <g fill={INK}>
          <path data-bracket="left" />
          <path data-bracket="right" />
        </g>
      </svg>
    </div>
  );
}
