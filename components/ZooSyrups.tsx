"use client";

import { useEffect, useRef } from "react";
import s from "./ZooSyrups.module.css";

/**
 * The Zoo Distillery syrup labels (Figma 2145:7531) taking turns in their scene
 * (2137:3355), in a loop: cucumber → hyssop → mango.
 *
 * The labels sit in a column, as they do in Figma, and the column moves down:
 * each step the current label travels out through the bottom while the next
 * one comes down from above into its place, one label-plus-gap of travel.
 * Eased in and out, in held frames; each label fades as it gets far from its
 * slot, so nothing pops at the scene's edges.
 *
 * The labels are dense (body copy, tables, barcodes in two custom fonts), so
 * they are 3× renders from Figma rather than rebuilt as vectors; they only
 * ever move whole.
 */
const LABELS = ["cucumber", "hyssop", "mango"] as const;

const HOLD_MS = 2800;
const MOVE_MS = 900;
/** ~15fps, the same held-frame rate as the logo */
const FRAMES = 14;
/** one step of travel, in label heights: the label plus the column's gap
 * (26.31 between 241-high labels in Figma) */
const STEP = 1 + 26.31 / 241.01;

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const HELD = "steps(1, end)";
const ease = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2);

/** a label travelling from y0 to y1 (in label heights), visible near its slot only */
function travel(y0: number, y1: number): Keyframe[] {
  return Array.from({ length: FRAMES + 1 }, (_, f) => {
    const y = y0 + (y1 - y0) * ease(f / FRAMES);
    // solid until a third of a step out of its slot, gone just before a full
    // step: the two labels never overlap, so mid-move both are still mostly there
    const opacity = Math.min(1, Math.max(0, 1 - (Math.abs(y) / STEP - 0.35) / 0.6));
    return {
      transform: `translateY(${(y * 100).toFixed(2)}%)`,
      opacity: +opacity.toFixed(3),
      offset: f / FRAMES,
      easing: HELD,
    };
  });
}
/** the outgoing label: from its slot down one step */
const leave = travel(0, STEP);
/** the incoming label: from one step above down into the slot */
const arrive = travel(-STEP, 0);

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function ZooSyrups() {
  const ref = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let cur = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running = false;
    const live: Animation[] = [];

    const show = (i: number) =>
      cards.current.forEach((c, k) => {
        if (c) c.style.opacity = k === i ? "1" : "0";
      });

    const step = () => {
      const prev = cur;
      cur = (cur + 1) % LABELS.length;
      const a = cards.current[prev];
      const b = cards.current[cur];
      if (a && b && !reduced()) {
        live.push(a.animate(leave, { duration: MOVE_MS, fill: "forwards" }));
        live.push(b.animate(arrive, { duration: MOVE_MS, fill: "backwards" }));
      }
      show(cur);
      timer = setTimeout(() => {
        live.splice(0).forEach((x) => x.cancel());
        step();
      }, HOLD_MS + MOVE_MS);
    };

    show(0);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) {
        running = true;
        timer = setTimeout(step, HOLD_MS);
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

  return (
    <div
      ref={ref}
      className={s.stage}
      role="img"
      aria-label="Zoo Distillery syrup labels: cucumber, hyssop and mango"
    >
      <div className={s.slot}>
        {LABELS.map((n, i) => (
          <img
            key={n}
            ref={(el) => {
              cards.current[i] = el;
            }}
            className={s.card}
            src={`${BASE}/zoo-syrups/${n}.jpg`}
            alt=""
            draggable={false}
            style={{ opacity: i === 0 ? 1 : 0 }}
          />
        ))}
      </div>
    </div>
  );
}
