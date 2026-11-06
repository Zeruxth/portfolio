"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONTACT_EMAIL, SECTIONS, sectionForPath } from "@/lib/sections";
import { useSectionHover } from "@/lib/section-hover";
import { ArrowCell } from "./ArrowCell";
import { Close } from "./icons";
import s from "./Menu.module.css";

export default function Menu() {
  const pathname = usePathname();
  const { setHovered } = useSectionHover();
  const active = sectionForPath(pathname);

  // Below the desktop layout the rail folds into one MENU row. It starts shut
  // on every page, home included, and arriving on a new page shuts it again.
  const [fold, setFold] = useState({ path: pathname, open: false });
  if (fold.path !== pathname) setFold({ path: pathname, open: false });
  const open = fold.open;

  return (
    <div className={s.rail} data-open={open}>
      <button
        type="button"
        className={s.toggle}
        aria-expanded={open}
        aria-controls="main-menu"
        onClick={() => setFold({ path: pathname, open: !open })}
      >
        <span className={s.title}>Menu</span>
        <span className={s.toggleMark}>
          <Close />
        </span>
      </button>

      <div className={s.drawer} id="main-menu">
        <div className={s.drawerIn}>
          <nav
            className={s.nav}
            aria-label="Main"
            onPointerLeave={() => setHovered(null)}
          >
            {SECTIONS.map((section) => (
              <Link
                key={section.key}
                href={section.href}
                className={s.row}
                data-arrow-host={section.key === active.key ? undefined : true}
                data-active={section.key === active.key}
                aria-current={section.key === active.key ? "page" : undefined}
                style={{ "--c": section.color, "--on": section.ink } as React.CSSProperties}
                onPointerEnter={(e) => e.pointerType !== "touch" && setHovered(section.key)}
                onFocus={() => setHovered(section.key)}
                onBlur={() => setHovered(null)}
              >
                <span className={s.head}>
                  <span className={s.title}>{section.label}</span>
                </span>
                {section.key !== active.key && <ArrowCell hidden />}
                {section.explainer && (
                  <span className={s.exp}>
                    <span className={s.expInner}>
                      <span className={s.expText}>{section.explainer}</span>
                    </span>
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <a className={s.contact} href={`mailto:${CONTACT_EMAIL}`} data-arrow-host>
            <p>
              Have a project, a job or some cool shit in mind? <em>Let’s talk</em>
            </p>
            <ArrowCell />
          </a>
        </div>
      </div>
    </div>
  );
}
