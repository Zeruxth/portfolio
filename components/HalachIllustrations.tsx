"use client";

import { useEffect, useRef, useState } from "react";
import s from "./HalachIllustrations.module.css";

/**
 * The small outcome illustrations from Halach Alenu (pages 170–205), in a row
 * (Figma 2177:2316). Every one is in black and white; one at a time slides to
 * the middle, grows and turns to colour, then hands over to the next, all on
 * one ease-in-out.
 *
 * Sizes are balanced by eye, not by height. Each piece was measured — its
 * proportions and how much of its box is actually drawing — and sized so a
 * sparse 2:1 tableau, a dense jerrycan and a thin gallows carry about the same
 * weight; then checked side by side, with two nudged by hand (198, 202).
 *
 * Each piece is placed by its visual centre (the centre of its ink, not of its
 * box) and scales around it, so whatever is in the middle is truly centred.
 *
 * Everything is measured in tile heights (cqh), so it scales with the tile.
 * Art: /public/halach-illustrations/<page>.webp, trimmed to the drawing.
 */

/** page, height and width (in tile heights, at the size it shows in the middle), visual centre (0–1 of its box) */
const ART: [string, number, number, number, number][] = [
  ["170", 0.3143, 0.5773, 0.517, 0.546],
  ["171", 0.4549, 0.4382, 0.499, 0.567],
  ["172", 0.3011, 0.6200, 0.402, 0.448],
  ["173", 0.2900, 0.6200, 0.495, 0.528],
  ["174", 0.4777, 0.4360, 0.462, 0.524],
  ["175", 0.4028, 0.4726, 0.517, 0.490],
  ["176", 0.4765, 0.5019, 0.508, 0.484],
  ["177", 0.5000, 0.4316, 0.477, 0.582],
  ["178", 0.3701, 0.6200, 0.536, 0.448],
  ["179", 0.5000, 0.4138, 0.387, 0.517],
  ["180", 0.5000, 0.2250, 0.409, 0.362],
  ["181", 0.5000, 0.3617, 0.480, 0.518],
  ["182", 0.5000, 0.4575, 0.484, 0.573],
  ["183", 0.3795, 0.5729, 0.421, 0.527],
  ["184", 0.3925, 0.5821, 0.441, 0.550],
  ["185", 0.3364, 0.6200, 0.502, 0.595],
  ["186", 0.5000, 0.2984, 0.500, 0.529],
  ["187", 0.5000, 0.3558, 0.445, 0.580],
  ["188", 0.5000, 0.2283, 0.503, 0.474],
  ["189", 0.5000, 0.4017, 0.499, 0.570],
  ["190", 0.5000, 0.3916, 0.511, 0.641],
  ["191", 0.5000, 0.3784, 0.457, 0.496],
  ["192", 0.4806, 0.3604, 0.521, 0.492],
  ["193", 0.3133, 0.6200, 0.636, 0.527],
  ["194", 0.3544, 0.5699, 0.518, 0.511],
  ["195", 0.4650, 0.5030, 0.350, 0.504],
  ["196", 0.5000, 0.2442, 0.529, 0.441],
  ["197", 0.4056, 0.6031, 0.487, 0.631],
  ["198", 0.4906, 0.6820, 0.518, 0.681],
  ["199", 0.4027, 0.4577, 0.486, 0.520],
  ["200", 0.4976, 0.4003, 0.489, 0.517],
  ["201", 0.4383, 0.4449, 0.545, 0.613],
  ["202", 0.3823, 0.4943, 0.509, 0.542],
  ["203", 0.4939, 0.5161, 0.539, 0.603],
  ["204", 0.4799, 0.4263, 0.465, 0.446],
  ["205", 0.4657, 0.6054, 0.324, 0.483],
];
const N = ART.length;
const FIRST = ART.findIndex(([p]) => p === "173");

/** the middle piece shows at its full size, the black-and-white ones 15% smaller */
const ON = 1;
const OFF = 0.85;
/** space between neighbours, in tile heights */
const GAP = 0.3;

/** one move, then the hold before the next; the move's timing lives in the CSS */
const MOVE_MS = 1400;
const HOLD_MS = 1600;

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** signed distance from the active piece, wrapping round so the row never ends */
const offset = (i: number, k: number) => ((i - k + N + N / 2) % N) - N / 2;

/** where each piece's visual centre sits (tile heights from the middle) when k is active */
function layout(k: number) {
  // how far a piece reaches to the left and right of its visual centre
  const reach = (i: number) => {
    const [, , w, cx] = ART[i];
    const sc = i === k ? ON : OFF;
    return { l: w * cx * sc, r: w * (1 - cx) * sc };
  };
  const x = new Array<number>(N);
  x[k] = 0;
  for (let d = 1; d <= N / 2; d++) {
    const r = (k + d) % N, rp = (k + d - 1) % N;
    x[r] = x[rp] + reach(rp).r + GAP + reach(r).l;
    if (d < N / 2) {
      const l = (k - d + N) % N, lp = (k - d + 1 + N) % N;
      x[l] = x[lp] - reach(lp).l - GAP - reach(l).r;
    }
  }
  return x;
}

export default function HalachIllustrations() {
  const ref = useRef<HTMLDivElement>(null);
  // opens on 173, the piece in the middle of the Figma frame
  const [k, setK] = useState(FIRST);
  const [prev, setPrev] = useState(FIRST);
  const [visible, setVisible] = useState(false);

  // only run while on screen
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => {
      setPrev(k);
      setK((k + 1) % N);
    }, MOVE_MS + HOLD_MS);
    return () => clearTimeout(t);
  }, [visible, k]);

  const x = layout(k);

  return (
    <div className={s.stage} ref={ref} aria-label="Illustrations from Halach Alenu" role="img">
      {ART.map(([page, h, w, cx, cy], i) => {
        const d = offset(i, k);
        // a piece that wraps from one end of the row to the other jumps, unseen, rather than sliding across
        const jumped = Math.abs(d - offset(i, prev)) > 1;
        return (
          <img
            key={page}
            className={s.piece}
            src={`${BASE}/halach-illustrations/${page}.webp`}
            alt=""
            draggable={false}
            data-on={i === k || undefined}
            data-jump={jumped || undefined}
            style={{
              width: `${w * 100}cqh`,
              height: `${h * 100}cqh`,
              // the visual centre goes to the point, and the piece scales around it
              transformOrigin: `${cx * 100}% ${cy * 100}%`,
              transform: `translate(calc(${x[i] * 100}cqh - ${cx * 100}%), -${cy * 100}%) scale(${i === k ? ON : OFF})`,
              visibility: Math.abs(d) > 5 ? "hidden" : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
