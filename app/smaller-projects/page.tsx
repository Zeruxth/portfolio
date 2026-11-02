import SmallGrid from "@/components/SmallGrid";
import { SMALL_PROJECTS } from "@/content/small-projects";

export const metadata = { title: "Smaller projects — AKI_WIP" };

export default function SmallerProjects() {
  return <SmallGrid projects={SMALL_PROJECTS} />;
}
