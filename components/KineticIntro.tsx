"use client";

import { useEffect, useRef } from "react";
import { mountKinetic, type KineticInstance } from "@/lib/kinetic";
import s from "./KineticIntro.module.css";

/**
 * Returns a fragment, so every node below is a direct child of the stage —
 * which is what lets the layers position against it and be clipped by it.
 */
export default function KineticIntro({ text }: { text: string }) {
  const intro = useRef<HTMLParagraphElement>(null);
  const cells = useRef<HTMLDivElement>(null);
  const cols = useRef<HTMLDivElement>(null);
  const peri = useRef<HTMLDivElement>(null);
  const panels = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const introEl = intro.current;
    const stage = introEl?.parentElement;
    if (!introEl || !stage || !cells.current || !cols.current || !peri.current || !panels.current) return;

    // motion is the whole point here, so a reader who opts out gets the plain paragraph
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const instance: KineticInstance = mountKinetic(
      { stage, intro: introEl, cells: cells.current, cols: cols.current, peri: peri.current, panels: panels.current },
      text,
    );
    return () => instance.destroy();
  }, [text]);

  return (
    <>
      <div ref={panels} className="k-layer k-panels" />
      <div className="k-slot" />
      <p ref={intro} className={`k-intro ${s.intro}`}>
        {text}
      </p>
      <div ref={cells} className="k-layer k-cells" />
      <div ref={cols} className="k-layer k-cols" />
      <div ref={peri} className="k-layer k-peri" />
    </>
  );
}
