"use client";

import { useCallback, useRef, useState } from "react";
import { useWipe, type WipeRun } from "./wipe";

/** long enough to read the reply line before the wipe takes you home */
const READ = 1800;

export type SentPhase = "idle" | "sent";

/**
 * What a form does once it has gone through: `done` folds the questions shut
 * and starts the opening line's scramble into the reply; `swapped`, called
 * when the reply is fully in, waits a beat for it to be read, then wipes home.
 */
export function useSent(words: Omit<WipeRun, "to">) {
  const wipe = useWipe();
  const [phase, setPhase] = useState<SentPhase>("idle");
  const started = useRef(false);

  const done = useCallback(() => {
    if (started.current) return;
    started.current = true;
    setPhase("sent");
    // back to the top, where the reply is
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelectorAll("form").forEach((f) => f.scrollTo({ top: 0, behavior: "smooth" }));
  }, []);

  const swapped = useCallback(() => {
    window.setTimeout(() => wipe({ ...words, to: "/" }), READ);
  }, [wipe, words]);

  return [phase, done, swapped] as const;
}
