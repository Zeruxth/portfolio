"use client";

import { useState } from "react";
import Link from "next/link";
import type { Project } from "@/content/projects";
import { placeholderTile } from "@/lib/placeholder";
import { Arrow } from "./icons";
import s from "./ProjectList.module.css";

export default function ProjectList({ projects }: { projects: Project[] }) {
  // one open at a time. It stays on the last row you touched rather than
  // collapsing on leave, so crossing the list doesn't thrash the layout.
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
            tabIndex={0}
            aria-expanded={isOpen}
            onPointerEnter={() => setOpen(project.slug)}
            onFocus={() => setOpen(project.slug)}
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
