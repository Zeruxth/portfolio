"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BY_KEY, sectionForPath } from "@/lib/sections";
import { useTabs } from "@/lib/tabs";
import { Logo } from "./icons";
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
  const pathname = usePathname();
  const { tabs, close } = useTabs();
  const current = sectionForPath(pathname).key;

  return (
    <div className={s.bar}>
      <div className={`${s.tab} ${s.logoTab}`} style={{ zIndex: 1 }}>
        <Link href="/" className={`${s.link} ${s.inner}`} aria-label="Home">
          <Logo className={s.logo} />
        </Link>
        <Edge />
      </div>

      {tabs.map((key, i) => {
        const section = BY_KEY[key];
        return (
          <div
            key={key}
            className={s.tab}
            style={{ zIndex: key === current ? tabs.length + 2 : i + 2 }}
          >
            <div className={s.inner}>
              <Link href={section.href} className={s.label}>
                {section.label}
              </Link>
              <button
                type="button"
                className={s.close}
                onClick={() => close(key)}
                aria-label={`Close ${section.label}`}
              >
                <Close />
              </button>
            </div>
            <Edge />
          </div>
        );
      })}
    </div>
  );
}
