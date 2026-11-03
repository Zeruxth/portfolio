import ProjectList from "@/components/ProjectList";
import { PROJECTS } from "@/content/projects";
import { pageMeta } from "@/lib/meta";
import { BY_KEY } from "@/lib/sections";

export const metadata = pageMeta("Projects", BY_KEY.projects.explainer!, "/projects/");

export default function Projects() {
  return (
    <>
      <h1 className="sr-only">Projects</h1>
      <ProjectList projects={PROJECTS} />
    </>
  );
}
