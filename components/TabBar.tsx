"use client";

import Link from "next/link";
import { useTabs } from "@/lib/tabs";
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

function Close() {
  return (
    <svg viewBox="0 0 10.7033 10.7033" fill="none" aria-hidden="true">
      <path d="M10.1634 0.539935L0.539937 10.1634" strokeWidth="1.52717" />
      <path d="M0.539935 0.539935L10.1634 10.1634" strokeWidth="1.52717" />
    </svg>
  );
}

export default function TabBar() {
  const { tabs, close } = useTabs();

  return (
    <div className={s.bar}>
      {/* earlier tabs stack above later ones, so a hovered tab fills behind its neighbour */}
      <div className={`${s.tab} ${s.logoTab}`} style={{ zIndex: tabs.length + 1 }}>
        <Link href="/" className={`${s.link} ${s.inner}`} aria-label="Home">
          <PandaLogo className={s.logo} />
        </Link>
        <Edge />
      </div>

      {tabs.map((tab, i) => (
        <div key={tab.id} className={s.tab} style={{ zIndex: tabs.length - i }}>
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
