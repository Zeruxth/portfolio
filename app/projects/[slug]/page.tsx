import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROJECTS } from "@/content/projects";
import CaseStudy from "@/components/CaseStudy";
import { pageMeta } from "@/lib/meta";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) return {};
  return pageMeta(project.title, project.description, `/projects/${slug}/`, project.image);
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const i = PROJECTS.findIndex((p) => p.slug === slug);
  if (i === -1) notFound();
  return <CaseStudy project={PROJECTS[i]} next={PROJECTS[(i + 1) % PROJECTS.length]} />;
}
