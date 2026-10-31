import ToolList from "@/components/ToolList";
import { TOOLS } from "@/content/tools";

export const metadata = { title: "Tools — AKI_WIP" };

export default function Tools() {
  return <ToolList tools={TOOLS} />;
}
