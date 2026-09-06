"use client";

import { useEffect, useRef } from "react";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";
import { Logo } from "./icons";
import s from "./PandaLogo.module.css";

/** the mark inks itself in once per visit, then idles */
const DRAWN_KEY = "aki:panda-drawn";

/** ms after which each group starts drawing, keyed by data-part */
const STAGGER: Record<string, number> = {
  head: 0, earRight: 90, earLeft: 110, eyes: 220,
  pupilLeft: 340, pupilRight: 360, nose: 430, mouth: 490, marks: 540,
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export default function PandaLogo({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);

  // Set the dash before first paint, or the complete mark flashes for a frame
  // before the draw-on starts.
  useIsomorphicLayoutEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let firstVisit = false;
    try {
      firstVisit = !sessionStorage.getItem(DRAWN_KEY);
      if (firstVisit) sessionStorage.setItem(DRAWN_KEY, "1");
    } catch {
      firstVisit = false; // private mode: skip rather than replay on every load
    }
    if (!firstVisit) return;

    const groups = Array.from(svg.querySelectorAll<SVGGElement>("g[data-part]"));
    for (const g of groups) {
      for (const path of Array.from(g.querySelectorAll("path"))) {
        const len = path.getTotalLength();
        path.style.strokeDasharray = `${len}`;
        path.style.strokeDashoffset = `${len}`;
      }
    }
    svg.dataset.draw = "true";

    // one frame later, release them — a transition needs a painted start value
    const raf = requestAnimationFrame(() => {
      for (const g of groups) {
        const delay = STAGGER[g.dataset.part ?? ""] ?? 0;
        for (const path of Array.from(g.querySelectorAll("path"))) {
          path.style.transitionDelay = `${delay}ms`;
          path.style.strokeDashoffset = "0";
        }
      }
    });

    const done = window.setTimeout(() => {
      for (const path of Array.from(svg.querySelectorAll("path"))) {
        path.style.strokeDasharray = "";
        path.style.strokeDashoffset = "";
        path.style.transitionDelay = "";
      }
      delete svg.dataset.draw;
    }, 1400);

    return () => { cancelAnimationFrame(raf); clearTimeout(done); };
  }, []);

  // Idle. Irregular on purpose — a metronomic blink reads as a broken loop.
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timers: number[] = [];

    const fire = (parts: string[], flag: string, clearAfter: number) => {
      for (const p of parts) {
        const g = svg.querySelector<SVGGElement>(`g[data-part="${p}"]`);
        if (!g) continue;
        g.dataset[flag] = "true";
        timers.push(window.setTimeout(() => { delete g.dataset[flag]; }, clearAfter));
      }
    };

    const scheduleBlink = () => {
      timers.push(window.setTimeout(() => {
        fire(["pupilLeft", "pupilRight"], "blink", 300);
        // real pandas double-blink sometimes
        if (Math.random() < 0.3) {
          timers.push(window.setTimeout(() => fire(["pupilLeft", "pupilRight"], "blink", 300), 420));
        }
        scheduleBlink();
      }, rand(4200, 9000)));
    };

    const scheduleTwitch = () => {
      timers.push(window.setTimeout(() => {
        fire([Math.random() < 0.5 ? "earLeft" : "earRight"], "twitch", 560);
        scheduleTwitch();
      }, rand(7000, 15000)));
    };

    scheduleBlink();
    scheduleTwitch();
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return <Logo className={`${s.logo} ${className ?? ""}`} ref={ref} />;
}
