import ProjectList from "@/components/ProjectList";
import { PROJECTS } from "@/content/projects";

export const metadata = { title: "Selected Projects — AKI_WIP" };

export default function Projects() {
  return <ProjectList projects={PROJECTS} />;
}
