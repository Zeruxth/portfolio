"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSectionHover } from "@/lib/section-hover";
import { BY_KEY, formPageFor, sectionForPath } from "@/lib/sections";
import { HOME_OPEN } from "@/lib/site";
import TabBar from "./TabBar";
import Menu from "./Menu";
import Band from "./Band";
import s from "./Shell.module.css";

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { hovered } = useSectionHover();

  const active = sectionForPath(pathname);
  // the form pages belong to no section: they fall through to home, but are not it
  const formPage = formPageFor(pathname) !== null;
  const shown = hovered ? BY_KEY[hovered] : active;
  const hot = hovered !== null;
  // a project's inner page gives the whole panel to the project — no menu rail
  const inner = /^\/projects\/[^/]+/.test(pathname);
  // a closed homepage offers no way further in: no menu, no band
  const closed = !HOME_OPEN && active.key === "home";

  return (
    <div className={s.frame}>
      <TabBar />
      <div
        className={s.panel}
        style={
          {
            "--sec": shown.color,
            "--accent": hot ? shown.color : "#222222",
          } as React.CSSProperties
        }
      >
        <div className={s.upper}>
          {!inner && !closed && <Menu />}
          {/* what the send wipe covers: the content frame, as the hero's panels do */}
          <main className={s.stage} data-wipe-area>
            {children}
          </main>
        </div>
        {/* the band belongs to the homepage only — no other designed frame has it */}
        {active.key === "home" && !formPage && !closed && (
          <Band section={shown} />
        )}
      </div>
    </div>
  );
}
