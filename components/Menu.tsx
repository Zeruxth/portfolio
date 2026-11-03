"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONTACT_EMAIL, SECTIONS, sectionForPath } from "@/lib/sections";
import { useSectionHover } from "@/lib/section-hover";
import { ArrowCell } from "./ArrowCell";
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
  );
}
