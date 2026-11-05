"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSectionHover } from "@/lib/section-hover";
import { BY_KEY, sectionForPath } from "@/lib/sections";
import { HOME_OPEN } from "@/lib/site";
import TabBar from "./TabBar";
import Menu from "./Menu";
import Band from "./Band";
import s from "./Shell.module.css";

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { hovered } = useSectionHover();

  const active = sectionForPath(pathname);
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
          <main className={s.stage}>{children}</main>
        </div>
        {/* the band belongs to the homepage only — no other designed frame has it */}
        {active.key === "home" && !closed && (
          <Band section={shown} />
        )}
      </div>
    </div>
  );
}
