"use client";

import { useState } from "react";
import Link from "next/link";
import type { Project } from "@/content/projects";
import { placeholderTile } from "@/lib/placeholder";
import { Arrow } from "./icons";
import s from "./ProjectList.module.css";

export default function ProjectList({ projects }: { projects: Project[] }) {
  // one open at a time; the design only ever shows a single expanded row
  const [open, setOpen] = useState<string | null>(projects[0]?.slug ?? null);

  return (
    <div className={s.list}>
      {projects.map((project, i) => {
        const isOpen = open === project.slug;
        return (
          <div
            key={project.slug}
            className={s.row}
            data-open={isOpen}
            role="button"
            tabIndex={0}
            aria-expanded={isOpen}
            onClick={() => setOpen(isOpen ? null : project.slug)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpen(isOpen ? null : project.slug);
              }
            }}
          >
            <div className={s.main}>
              <div>
                <h2 className={s.title}>{project.title}</h2>
                <div className={s.reveal}>
                  <div className={s.revealIn}>
                    <p className={s.desc}>{project.description}</p>
                  </div>
                </div>
              </div>

              <div className={s.reveal}>
                <div className={s.revealIn}>
                  <Link
                    href={`/projects/${project.slug}`}
                    className={s.enter}
                    tabIndex={isOpen ? 0 : -1}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Enter
                    <Arrow />
                  </Link>
                </div>
              </div>
            </div>

            <div className={`${s.reveal} ${s.metaCol}`}>
              <div className={s.revealIn}>
                <ul className={s.meta}>
                  <li>
                    {project.disciplines.map((d, k) => (
                      <span key={d}>
                        {d}
                        {k < project.disciplines.length - 1 && (
                          <>
                            /<wbr />
                          </>
                        )}
                      </span>
                    ))}
                  </li>
                  <li>{project.year}</li>
                  {project.note && <li>{project.note}</li>}
                </ul>
              </div>
            </div>

            <div
              className={s.cover}
              style={{
                backgroundImage: project.image
                  ? `url('${project.image}')`
                  : placeholderTile(i),
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
