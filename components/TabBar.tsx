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

/** the space between the end of a running name and its next pass */
const RUN_GAP = 40;
/** how fast a running name travels, px a second */
const RUN_SPEED = 40;

/**
 * A tab's name. When the tab has less room than the name, it runs: the name
 * travels left without stopping and a second pass follows it in, the way a
 * train's destination board loops a long name, rather than cutting it off.
 */
function Name({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const first = ref.current;
    const box = first?.parentElement?.parentElement;
    if (!first || !box) return;
    const measure = () => {
      const w = first.getBoundingClientRect().width;
      if (w - box.clientWidth > 1) {
        box.dataset.run = "true";
        box.style.setProperty("--run", `${-(w + RUN_GAP)}px`);
        box.style.setProperty("--run-gap", `${RUN_GAP}px`);
        box.style.setProperty("--run-time", `${((w + RUN_GAP) / RUN_SPEED).toFixed(2)}s`);
      } else {
        delete box.dataset.run;
        box.style.removeProperty("--run");
        box.style.removeProperty("--run-gap");
        box.style.removeProperty("--run-time");
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    ro.observe(first);
    // the webfont is narrower than the fallback, so measure again once it is in
    void document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [text]);

  return (
    <span className={s.run}>
      <span ref={ref} className={s.pass}>
        {text}
      </span>
      {/* the pass that follows it in; only shown while the name runs */}
      <span className={s.pass} aria-hidden="true">
        {text}
      </span>
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
