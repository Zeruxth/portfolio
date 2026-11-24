"use client";

import { useCallback, useRef, useState } from "react";
import { useWipe, type WipeRun } from "./wipe";

/** long enough to read the reply line before the wipe takes you home */
const READ = 1800;
/** each row folds over this long, the next one starting this much later */
const FOLD = 650;
const STAGGER = 55;
/** a strong ease in and out, so each row gathers, then snaps shut */
const EASE = "cubic-bezier(0.76, 0, 0.24, 1)";

export type SentPhase = "idle" | "sent";

/**
 * What a form does once it has gone through: `done` folds the questions shut,
 * row by row from the bottom up (from where you pressed Send), and starts the
 * opening line's scramble into the reply; `swapped`, called once the reply is
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

function fold(): Promise<void> {
  const host = document.querySelector<HTMLElement>("[data-fold-rows]");
  if (!host) return Promise.resolve();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    host.style.display = "none";
    return Promise.resolve();
  }
  // every row, part labels included, in reading order; the send box rides along with the last
  const rows = [...host.querySelectorAll<HTMLElement>(":scope > *, :scope > section > *")].filter(
    (el) => el.tagName !== "SECTION" && getComputedStyle(el).position !== "absolute" && el.offsetHeight > 0,
  );
  const send = host.querySelector<HTMLElement>("[data-send]");
  send?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" });

  const anims = rows.reverse().map((row, i) => {
    const cs = getComputedStyle(row);
    row.style.overflow = "hidden";
    return row.animate(
      [
        { height: `${row.offsetHeight}px`, minHeight: "0px", borderBottomWidth: cs.borderBottomWidth },
        { height: "0px", minHeight: "0px", borderBottomWidth: "0px" },
      ],
      { duration: FOLD, delay: i * STAGGER, easing: EASE, fill: "forwards" },
    ).finished;
  });
  return Promise.all(anims).then(() => {
    host.style.display = "none";
    window.scrollTo(0, 0);
    document.querySelectorAll("form").forEach((f) => f.scrollTo(0, 0));
  });
}
