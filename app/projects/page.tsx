import Link from "next/link";
import { PROJECTS } from "@/content/projects";
import { placeholderTile } from "@/lib/placeholder";
import s from "../page.module.css";

export const metadata = { title: "Selected Projects — AKI_WIP" };

export default function Projects() {
  return (
    <>
      <div className={s.head}>
        <span>Selected Projects</span>
        <span>{PROJECTS.length} pieces</span>
      </div>
      <div className={s.body}>
        <div className={s.grid}>
          {PROJECTS.map((p, i) => (
            <Link
              key={p.slug}
              href={`/projects/${p.slug}`}
              className={s.cell}
              style={{ backgroundImage: p.cover ?? placeholderTile(i) }}
            >
              <span className={s.cap}>
                <span>{p.title}</span>
                <span>{p.year}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
