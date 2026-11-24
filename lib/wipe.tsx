"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { faceMetrics } from "./kinetic";
import { GROUNDS } from "./palette";
import { useIsomorphicLayoutEffect } from "./use-isomorphic-layout-effect";

/*
 * The hero's PANEL SPLIT, played once to carry you somewhere: coloured panels
 * wipe down over the frame one after another, each filled with one giant
 * word; once they've closed the route changes underneath, and when the new
 * page is there they wipe back up off it. It lives here, above the pages, so
 * it outlasts the page that started it. It uses kinetic.css's own .k-panels /
 * .k-pan / .k-fill / .k-pn, so timing, colours and type are the hero's.
 */

export interface WipeRun {
  /** one giant word per panel: five across, as the hero has */
  words: string[];
  /** three for a narrow frame, which gets three panels */
  short: string[];
  /** where you are once the panels open again */
  to: string;
}

const STAGGER_IN = 45; // ms between panels, as the hero enters
const STAGGER_OUT = 30; // and as it leaves
const WIPE = 240; // .k-pan's clip-path transition
const HOLD = 700; // closed, at least, before opening onto the new page
const GIVE_UP = 3000; // open anyway if the page is slow to arrive

const Ctx = createContext<(run: WipeRun) => void>(() => {});

/** start the wipe; the frame to cover is the element marked data-wipe-area */
export function useWipe() {
  return useContext(Ctx);
}

interface Live {
  words: string[];
  colours: string[];
  to: string;
  box: { top: number; left: number; width: number; height: number };
}

export function WipeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [live, setLive] = useState<Live | null>(null);
  const panels = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const stage = useRef<"idle" | "closing" | "closed" | "opening">("idle");
  const closedAt = useRef(0);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const play = useCallback((run: WipeRun) => {
    if (stage.current !== "idle") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(run.to);
      return;
    }
    const area = document.querySelector("[data-wipe-area]") ?? document.body;
    const r = area.getBoundingClientRect();
    const top = Math.max(r.top, 0);
    const bottom = Math.min(r.bottom, window.innerHeight);
    const box = { top, left: r.left, width: r.width, height: bottom - top };
    stage.current = "closing";
    // pages that arrive under the panels hold their entrances until they open (Band)
    document.documentElement.dataset.wipe = "on";
    setLive({
      words: box.width < 760 ? run.short : run.words,
      colours: shuffled(GROUNDS), // dealt now, not at build time, so every run is fresh
      to: run.to,
      box,
    });
  }, [router]);

  // size each word to fill its panel, then close the panels
  useIsomorphicLayoutEffect(() => {
    if (!live || stage.current !== "closing" || !panels.current) return;
    const pans = [...panels.current.children] as HTMLElement[];
    fit(pans, live.box.height);
    pans.forEach((p, i) => { p.style.transitionDelay = `${i * STAGGER_IN}ms`; });
    void panels.current.offsetWidth; // so the wipe animates from open
    panels.current.classList.add("is-in");

    later(() => {
      // fully closed: change the page underneath
      stage.current = "closed";
      closedAt.current = performance.now();
      router.push(live.to);
      later(open, GIVE_UP);
    }, WIPE + (pans.length - 1) * STAGGER_IN);
  }, [live]);

  function open() {
    if (stage.current !== "closed" || !panels.current) return;
    stage.current = "opening";
    // the new page's frame can be a different size (home has its band): fit it before opening
    const area = document.querySelector("[data-wipe-area]");
    if (area) {
      const r = area.getBoundingClientRect();
      const top = Math.max(r.top, 0);
      const bottom = Math.min(r.bottom, window.innerHeight);
      Object.assign(panels.current.style, {
        top: `${top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${bottom - top}px`,
      });
      fit([...panels.current.children] as HTMLElement[], bottom - top);
    }
    const pans = [...panels.current.children] as HTMLElement[];
    pans.forEach((p, i) => { p.style.transitionDelay = `${(pans.length - 1 - i) * STAGGER_OUT}ms`; });
    panels.current.classList.remove("is-in");
    delete document.documentElement.dataset.wipe;
    window.dispatchEvent(new Event("wipe-open"));
    later(() => {
      stage.current = "idle";
      setLive(null);
    }, WIPE + (pans.length - 1) * STAGGER_OUT);
  }

  // the new page has arrived: open onto it once the panels have held a beat
  useEffect(() => {
    if (!live || stage.current !== "closed") return;
    if (pathname.replace(/\/+$/, "") !== live.to.replace(/\/+$/, "")) return;
    later(open, Math.max(HOLD - (performance.now() - closedAt.current), 0));
  }, [pathname, live]);

  return (
    <Ctx.Provider value={play}>
      {children}
      {live && (
        <div
          ref={panels}
          className="k-panels"
          style={{ position: "fixed", zIndex: 20, pointerEvents: "none", ...live.box }}
          aria-hidden="true"
        >
          {live.words.map((w, i) => (
            <div key={i} className="k-pan" style={{ flexGrow: 1, background: live.colours[i % live.colours.length] }}>
              <div className="k-fill">{w.toUpperCase()}</div>
              <div className="k-pn">{`P${String(i + 1).padStart(2, "0")}`}</div>
            </div>
          ))}
        </div>
      )}
    </Ctx.Provider>
  );
}

/** each word fills its panel: as wide as the panel, caps stretched to its full height */
function fit(pans: HTMLElement[], height: number) {
  for (const p of pans) {
    const f = p.querySelector<HTMLElement>(".k-fill")!;
    f.style.transform = "none";
    f.style.fontSize = "100px";
    const w100 = f.getBoundingClientRect().width || 1;
    const M = faceMetrics(f);
    const w = p.clientWidth;
    const fs = ((w * 1.08) / w100) * 100;
    const sy = height / (M.capR * fs); // caps fill the panel, no dead space
    f.style.fontSize = `${fs.toFixed(1)}px`;
    f.style.left = `${(-w * 0.04).toFixed(1)}px`;
    f.style.top = `${(-(M.blTopR - M.capR) * fs * sy).toFixed(1)}px`;
    f.style.transform = `scaleY(${sy.toFixed(3)})`;
  }
}

function shuffled<T>(list: T[]): T[] {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
