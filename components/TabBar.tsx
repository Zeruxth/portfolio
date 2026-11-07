"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { tabForPath, useTabs } from "@/lib/tabs";
import { Close } from "./icons";
import PandaLogo from "./PandaLogo";
import s from "./TabBar.module.css";

/** the diagonal that closes each tab; the fill is the .tab silhouette in CSS */
function Edge() {
  return (
    <svg className={s.edge} viewBox="0 0 72.64 60.77" preserveAspectRatio="none" aria-hidden="true">
      <path className={s.edgeLine} d="M0.32 0.384L72.32 60.384" />
    </svg>
  );
}

/**
 * A tab's name. When the tab has less room than the name, it slides along to
 * show the end, holds, and slides back, the way a train's destination board
 * runs a long name, rather than cutting it off.
 */
function Name({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const run = ref.current;
    const box = run?.parentElement;
    if (!run || !box) return;
    const measure = () => {
      const over = run.scrollWidth - box.clientWidth;
      if (over > 1) {
        box.dataset.run = "true";
        box.style.setProperty("--run", `${-Math.ceil(over)}px`);
        // about 40px a second each way; the moves are 70% of the loop, the holds the rest
        box.style.setProperty("--run-time", `${Math.max(4, (over / 40) * 2 / 0.7).toFixed(2)}s`);
      } else {
        delete box.dataset.run;
        box.style.removeProperty("--run");
        box.style.removeProperty("--run-time");
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    ro.observe(run);
    // the webfont is narrower than the fallback, so measure again once it is in
    void document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [text]);

  return (
    <span ref={ref} className={s.run}>
      {text}
    </span>
  );
}

export default function TabBar() {
  const { tabs, close } = useTabs();
  const pathname = usePathname();
  // Only the logo goes inert, and only on home: there is genuinely nothing to
  // do there. A section tab always has an actionable close button, so it keeps
  // its hover even while you are on that page.
  const atHome = tabForPath(pathname) === null;

  return (
    <div className={s.bar}>
      {/* earlier tabs stack above later ones, so a hovered tab fills behind its neighbour */}
      <div
        className={`${s.tab} ${s.logoTab}`}
        data-active={atHome}
        style={{ zIndex: tabs.length + 1 }}
      >
        <Link href="/" className={`${s.link} ${s.inner}`} aria-label="Home">
          <PandaLogo className={s.logo} />
        </Link>
        <Edge />
      </div>

      {tabs.map((tab, i) => (
        <div
          key={tab.id}
          className={s.tab}
          // a tab on the way to the current one; a phone only has room for the last
          data-mid={i < tabs.length - 1 || undefined}
          style={{ zIndex: tabs.length - i }}
        >
          <div className={s.inner}>
            <Link href={tab.href} className={s.label} aria-label={tab.label}>
              <Name text={tab.label} />
            </Link>
            <button
              type="button"
              className={s.close}
              onClick={() => close(tab.id)}
              aria-label={`Close ${tab.label}`}
            >
              <Close />
            </button>
          </div>
          <Edge />
        </div>
      ))}
    </div>
  );
}
