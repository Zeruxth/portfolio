import { notFound } from "next/navigation";
import { PROJECTS } from "@/content/projects";
import s from "../../page.module.css";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <>
      <div className={s.head}>
        <span>{project.title}</span>
        <span>
          {project.discipline} · {project.year}
        </span>
      </div>
      <div className={s.body}>
        <p className={s.prose}>
          Case study copy goes here. This template is scaffolding — the project page
          has not been designed yet.
        </p>
      </div>
    </>
  );
}
