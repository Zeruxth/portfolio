import ToolList from "@/components/ToolList";
import { TOOLS } from "@/content/tools";
import { pageMeta } from "@/lib/meta";
import { BY_KEY } from "@/lib/sections";

export const metadata = pageMeta("Tools", BY_KEY.tools.explainer!, "/tools/");

export default function Tools() {
  return (
    <>
      <h1 className="sr-only">Tools</h1>
      <ToolList tools={TOOLS} />
    </>
  );
}
