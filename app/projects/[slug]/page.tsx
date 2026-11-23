import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROJECTS } from "@/content/projects";
import CaseStudy from "@/components/CaseStudy";
import { JsonLd, PERSON_ID, SITE_ID, SITE_URL, pageMeta } from "@/lib/meta";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) return {};
  return pageMeta(project.title, project.description, `/projects/${slug}/`, project.image, "article");
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const i = PROJECTS.findIndex((p) => p.slug === slug);
  if (i === -1) notFound();
  const project = PROJECTS[i];
  const url = `${SITE_URL}/projects/${slug}/`;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          "@id": `${url}#work`,
          url,
          name: project.title,
          abstract: project.description,
          description: project.study.summary,
          dateCreated: project.year,
          genre: project.disciplines,
          image: `${SITE_URL}${project.image}`,
          creator: { "@id": PERSON_ID },
          isPartOf: { "@id": SITE_ID },
          ...(project.study.credit && {
            contributor: { "@type": "Person", name: project.study.credit.name, url: project.study.credit.href },
          }),
        }}
      />
      <CaseStudy project={project} next={PROJECTS[(i + 1) % PROJECTS.length]} />
    </>
  );
}
