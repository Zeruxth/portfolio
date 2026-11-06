"use client";

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
            <Link href={tab.href} className={s.label}>
              {tab.label}
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
