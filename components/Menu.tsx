"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS, sectionForPath } from "@/lib/sections";
import { useSectionHover } from "@/lib/section-hover";
import { Arrow } from "./icons";
import s from "./Menu.module.css";

export default function Menu() {
  const pathname = usePathname();
  const { setHovered } = useSectionHover();
  const active = sectionForPath(pathname);

  return (
    <div className={s.rail}>
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
            data-active={section.key === active.key}
            aria-current={section.key === active.key ? "page" : undefined}
            style={{ "--c": section.color, "--on": section.ink } as React.CSSProperties}
            onPointerEnter={() => setHovered(section.key)}
            onFocus={() => setHovered(section.key)}
            onBlur={() => setHovered(null)}
          >
            <span className={s.head}>
              <span className={s.title}>{section.label}</span>
              <Arrow className={s.arrow} />
            </span>
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

      <div className={s.contact}>
        <p>
          Have a project, a job or some cool shit in mind? <em>Let’s talk</em>
        </p>
        <Arrow className={s.contactArrow} />
      </div>
    </div>
  );
}
