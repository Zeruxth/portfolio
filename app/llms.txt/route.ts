import { PROJECTS } from "@/content/projects";
import { SMALL_PROJECTS } from "@/content/small-projects";
import { TOOLS } from "@/content/tools";
import { NAME, PROFILES, ROLE, SITE_URL } from "@/lib/meta";
import { BY_KEY } from "@/lib/sections";

export const dynamic = "force-static";

/**
 * /llms.txt: a plain-text map of the site for AI tools (llmstxt.org), built from
 * the same content files as the pages, so it never drifts from them.
 */
export function GET() {
  const lines = [
    `# ${NAME} (AKI_WIP)`,
    "",
    `> ${NAME} is a multidisciplinary ${ROLE.toLowerCase()} based in Tel Aviv, working across print, screen, motion and objects: visual identities, editorial and book design, illustration, packaging, motion and web. Currently a visual designer at Studio&more; B.Des. in Visual Communication from Wizo (University of Haifa).`,
    "",
    `- [About](${SITE_URL}/about/): ${BY_KEY.about.explainer}`,
    `- [LinkedIn](${PROFILES.linkedin})`,
    `- [Instagram](${PROFILES.instagram})`,
    "",
    "## Selected projects",
    "",
    ...PROJECTS.map(
      (p) =>
        `- [${p.title}](${SITE_URL}/projects/${p.slug}/): ${p.description} (${p.year}; ${p.disciplines.join(", ")}${p.note ? `; ${p.note}` : ""})`,
    ),
    "",
    "## Smaller projects",
    "",
    `- [Smaller projects](${SITE_URL}/smaller-projects/): ${BY_KEY.smaller.explainer}`,
    ...SMALL_PROJECTS.map((p) => `  - ${p.title}: ${p.description}`),
    "",
    "## Tools",
    "",
    `- [Tools](${SITE_URL}/tools/): ${BY_KEY.tools.explainer}`,
    ...TOOLS.map((t) => `  - ${t.title} (${t.platform}, ${t.year}): ${t.description}`),
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
