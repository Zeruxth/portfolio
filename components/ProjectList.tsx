"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Project } from "@/content/projects";
import { ArrowCell } from "./ArrowCell";
import s from "./ProjectList.module.css";

// images live under /public, which Pages serves below the base path
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// the pointer rests this long on a row before it opens, so crossing the list opens nothing
const HOVER_DELAY = 120;
// how long a row takes to open (.reveal and .cover): nothing else opens until it has
const OPEN_MS = 800;

export default function ProjectList({ projects }: { projects: Project[] }) {
  // the page opens with every row closed. A mouse opens the row it rests on, and
  // that row stays open until another takes over; clicking a row goes into it.
  // Touch has no hover, so its first tap opens and its second goes in
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pending = useRef<string | null>(null);
  const settled = useRef(0);
  const pointer = useRef({ x: -1, y: -1 });

  const cancel = () => {
    clearTimeout(timer.current);
    pending.current = null;
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const hover = (slug: string, e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    // a row sliding under a still pointer, or a scroll, is not the pointer moving
    if (e.clientX === pointer.current.x && e.clientY === pointer.current.y) return;
    pointer.current = { x: e.clientX, y: e.clientY };
    if (slug === open) return cancel();
    if (slug === pending.current) return;
    cancel();
    pending.current = slug;
    timer.current = setTimeout(() => {
      pending.current = null;
      settled.current = performance.now() + OPEN_MS;
      setOpen(slug);
    }, Math.max(HOVER_DELAY, settled.current - performance.now()));
  };

  return (
    <div className={s.list} onPointerLeave={cancel}>
      {projects.map((project, i) => {
        const isOpen = open === project.slug;
        return (
          <div
            key={project.slug}
            className={s.row}
            style={{ animationDelay: `${i * 55}ms` }}
            data-open={isOpen}
            onPointerMove={(e) => hover(project.slug, e)}
            onClick={(e) => {
              // dragging across the description to copy it isn't a click on the row
              if (window.getSelection()?.toString()) return;
              if (isOpen || (e.nativeEvent as PointerEvent).pointerType === "mouse") {
                router.push(`/projects/${project.slug}`);
              } else {
                setOpen(project.slug);
              }
            }}
          >
            <div className={s.main}>
              <div>
                <h2 className={s.title}>
                  {/* the row takes the click; this is the way in for a keyboard or a screen reader */}
                  <button type="button" className={s.toggle} aria-expanded={isOpen}>
                    {project.title}
                  </button>
                </h2>
                <div className={s.reveal} inert={!isOpen}>
                  <div className={s.revealIn}>
                    <p className={s.desc}>{project.description}</p>
                  </div>
                </div>
              </div>

            </div>

            <div className={`${s.reveal} ${s.metaCol}`} inert={!isOpen}>
              <div className={s.revealIn}>
                <ul className={s.meta}>
                  <li>
                    {/* a tag never splits ("DIGITAL EXPERIENCE" stays whole); lines break after a slash */}
                    {project.disciplines.map((d, k) => (
                      <span key={d}>
                        <span className={s.tag}>
                          {d}
                          {k < project.disciplines.length - 1 && "\u00a0/"}
                        </span>
                        {" "}
                      </span>
                    ))}
                  </li>
                  <li>{project.year}</li>
                  {project.note && <li>{project.note}</li>}
                </ul>
              </div>
            </div>

            {isOpen && (
              <Link
                href={`/projects/${project.slug}`}
                className={s.enter}
                data-arrow-host
                onClick={(e) => e.stopPropagation()}
              >
                <span className={s.enterLabel}>Enter</span>
                <ArrowCell corner="inline" />
              </Link>
            )}

            <div
              className={s.cover}
              style={{ backgroundImage: `url('${BASE}${project.image}')` }}
            />
          </div>
        );
      })}
    </div>
  );
}
