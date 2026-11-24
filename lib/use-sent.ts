"use client";

import { useCallback, useRef, useState } from "react";
import { useWipe, type WipeRun } from "./wipe";

/** long enough to read the reply line before the wipe takes you home */
const READ = 1800;
/** the fold: one movement, the form's bottom edge rising to the opening line */
const FOLD = 900;
/** the long form glides back to the top first, so the fold happens in view */
const GLIDE = 600;
/** a strong ease in and out: it gathers, then closes */
const EASE = "cubic-bezier(0.76, 0, 0.24, 1)";

export type SentPhase = "idle" | "sent";

/**
 * What a form does once it has gone through: `done` folds the form up into
 * its opening line and starts that line's scramble into the reply; `swapped`, called once the reply is
 * in, waits a beat for it to be read, then wipes home.
 */
export function useSent(words: Omit<WipeRun, "to">) {
  const wipe = useWipe();
  const [phase, setPhase] = useState<SentPhase>("idle");
  const started = useRef(false);
  const folded = useRef<Promise<void>>(Promise.resolve());

  const done = useCallback(() => {
    if (started.current) return;
    started.current = true;
    setPhase("sent");
    folded.current = fold();
  }, []);

  const swapped = useCallback(() => {
    // the reply is in; wait for the fold too, then give it a moment to be read
    void folded.current.then(() => window.setTimeout(() => wipe({ ...words, to: "/" }), READ));
  }, [wipe, words]);

  return [phase, done, swapped] as const;
}

/**
 * Folds the form up like a blind: its bottom edge, drawn as a rule, rises
 * until it meets the opening line. A long form first glides back to the top,
 * so all of this happens where it can be seen.
 */
async function fold(): Promise<void> {
  const body = document.querySelector<HTMLElement>("[data-fold]");
  if (!body) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    body.style.display = "none";
    return;
  }
  body.querySelector<HTMLElement>("[data-send]")?.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: 200,
    fill: "forwards",
  });

  // the page scrolls in the form on a wide screen, in the window on a phone
  const form = body.closest("form");
  const scroller = form && form.scrollHeight > form.clientHeight + 1 ? form : null;
  await glideToTop(scroller);

  // fold only what's on screen; anything further down is already out of sight
  const top = body.getBoundingClientRect().top;
  const frame = (scroller ?? document.documentElement).getBoundingClientRect();
  const bottom = Math.min(body.getBoundingClientRect().bottom, frame.bottom, window.innerHeight);
  const height = Math.max(bottom - top, 0);

  Object.assign(body.style, {
    flex: "none",
    height: `${height}px`,
    overflow: "hidden",
    boxSizing: "border-box",
    borderBottom: "1px solid var(--ink)",
  });
  await body.animate([{ height: `${height}px` }, { height: "0px" }], {
    duration: FOLD,
    easing: EASE,
    fill: "forwards",
  }).finished;
  body.style.display = "none";
}

/** an eased scroll back to the top, so the fold starts from the opening line */
function glideToTop(scroller: HTMLElement | null): Promise<void> {
  const from = scroller ? scroller.scrollTop : window.scrollY;
  if (from <= 0) return Promise.resolve();
  const set = (y: number) => (scroller ? (scroller.scrollTop = y) : window.scrollTo(0, y));
  const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
  return new Promise((done) => {
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min((now - t0) / GLIDE, 1);
      set(from * (1 - ease(k)));
      if (k < 1) requestAnimationFrame(step);
      else done();
    };
    requestAnimationFrame(step);
  });
}
