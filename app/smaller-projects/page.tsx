import SmallGrid from "@/components/SmallGrid";
import { SMALL_PROJECTS } from "@/content/small-projects";
import { pageMeta } from "@/lib/meta";
import { BY_KEY } from "@/lib/sections";

export const metadata = pageMeta("Smaller projects", BY_KEY.smaller.explainer!, "/smaller-projects/");

export default function SmallerProjects() {
  return (
    <>
      <h1 className="sr-only">Smaller projects</h1>
      <SmallGrid projects={SMALL_PROJECTS} />
    </>
  );
}
