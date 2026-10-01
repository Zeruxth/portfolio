"use client";

import { useEffect, useId, useRef, useState } from "react";
import s from "./ZooLabels.module.css";

/**
 * The three Zoo Distillery labels (Figma 2137:3167), one after another in a loop,
 * animated the way they were made rather than with a generic reveal.
 *
 * Each label builds itself, easing in — slow to start, then in a rush:
 *  1. the title is stamped, landing slightly out of register
 *  2. the ink pass: every black line draws itself, back to front, so for a
 *     moment you see the whole drawing, hidden lines included
 *  3. the colour pass: flat colour lands under the ink, misregistered like a
 *     screen-print pass, and jerks into register
 *  4. the footer is stamped
 *
 * Then it takes itself apart, ramping up — slow, then faster and faster into
 * the cut: colour lifts off register, the ink un-draws, the type peels. A
 * one-frame cut to the next colour, and the next build. Timings live in the CSS.
 *
 * Everything moves at a stop-motion frame rate — keyframes hold rather than
 * tween — and the linework boils throughout: the displacement noise is
 * re-seeded at 8fps, the way hand-drawn frames never sit perfectly still.
 *
 * Click (or Enter) for full screen — the label is shown whole there, letterboxed,
 * rather than cropped to the cover's square.
 *
 * Art: /public/zoo-labels/{panda,bird,seal}.svg, built from the Figma geometry
 * with real centre-line strokes (.l, pathLength 1) and fills (.c, in .cw),
 * grouped per illustration piece (.p, --i = paint order, --n = count).
 */
const LABELS = ["panda", "bird", "seal"] as const;
/** each sheet's ground, the fill of its background rect, for the margin round an inset label */
const GROUNDS = ["#1453f3", "#f956ff", "#045d17"];

/** where the label sits in its tile, in % of the tile */
export interface Inset { left: number; top: number; width: number; height: number }

/** from a label going "on" to it starting to take itself apart */
const HOLD_MS = 6000;
/** the unbuild has to finish before the cut; matches the out-timings in the CSS */
const UNBUILD_MS = 1200;
const BOIL_FPS = 8;

/** Pages serves the site from a sub-path; public files have to be asked for under it */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * `inset` sets the label into a larger tile, at those % of it; the margin
 * around it takes the current sheet's ground and the paper covers the lot, as
 * a printed label on its own colour does. Full screen still shows the label alone.
 */
const paperStyle = () => ({ backgroundImage: `url("${BASE}/zoo-labels/paper.jpg")` });

export default function ZooLabels({ inset }: { inset?: Inset } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [svgs, setSvgs] = useState<string[] | null>(null);
  const [cur, setCur] = useState(-1);
  /** the current label is taking itself apart */
  const [leaving, setLeaving] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all(
      LABELS.map((n) => fetch(`${BASE}/zoo-labels/${n}.svg`).then((r) => r.text())),
    ).then((t) => alive && setSvgs(t));
    return () => {
      alive = false;
    };
  }, []);

  // only run while on screen
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!svgs || !visible) return;
    if (cur === -1) {
      setCur(0);
      return;
    }
    if (leaving) {
      const t = setTimeout(() => {
        setLeaving(false);
        setCur((cur + 1) % LABELS.length);
      }, UNBUILD_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setLeaving(true), HOLD_MS);
    return () => clearTimeout(t);
  }, [svgs, visible, cur, leaving]);

  // line boil: swap between three noise seeds
  useEffect(() => {
    const el = ref.current;
    if (!el || !visible) return;
    let k = 0;
    const set = () => el.style.setProperty("--boil", `url(#${uid}b${k})`);
    set();
    if (reduced()) return;
    const t = setInterval(() => {
      k = (k + 1) % 3;
      set();
    }, 1000 / BOIL_FPS);
    return () => clearInterval(t);
  }, [uid, visible]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else ref.current?.requestFullscreen?.();
  };

  return (
    <div
      ref={ref}
      className={s.stage}
      data-inset={inset ? "" : undefined}
      style={
        {
          "--edge": `url(#${uid}edge)`,
          ...(inset && {
            background: GROUNDS[Math.max(cur, 0)],
            "--l": `${inset.left}%`,
            "--t": `${inset.top}%`,
            "--w": `${inset.width}%`,
            "--h": `${inset.height}%`,
          }),
        } as React.CSSProperties
      }
      role="button"
      tabIndex={0}
      aria-label="Zoo Distillery labels, animated. Open full screen."
      onClick={toggleFullscreen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleFullscreen();
        }
      }}
    >
      <svg className={s.defs} width="0" height="0">
        {/* the title's ink edge: in Figma the label type has a textured brush
            stroke that doesn't export, so the rough edge is made with fine noise.
            Scaled to the title's stroke (0.4 against the logo's 0.97). */}
        <filter id={`${uid}edge`} x="-3%" y="-3%" width="106%" height="106%">
          <feTurbulence type="fractalNoise" baseFrequency="0.46" numOctaves={2} seed={7} />
          <feDisplacementMap in="SourceGraphic" scale="0.55" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {[0, 1, 2].map((k) => (
          <filter key={k} id={`${uid}b${k}`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves={2} seed={k * 11 + 4} />
            <feDisplacementMap in="SourceGraphic" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        ))}
      </svg>
      <div className={s.canvas}>
        {svgs?.map((svg, i) => (
          <div
            key={LABELS[i]}
            className={s.label}
            data-state={i === cur ? (leaving ? "out" : "on") : "off"}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ))}
        {!inset && <div className={s.paper} style={paperStyle()} />}
      </div>
      {inset && <div className={s.paper} style={paperStyle()} />}
    </div>
  );
}
