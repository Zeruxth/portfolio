import type { MetadataRoute } from "next";
import { PROJECTS } from "@/content/projects";
import { SITE_URL } from "@/lib/meta";
import { SECTIONS } from "@/lib/sections";
import { HOME_OPEN } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // empty while the homepage is closed; flipping HOME_OPEN lists everything
  if (!HOME_OPEN) return [];
  const paths = [
    ...SECTIONS.map((s) => (s.href === "/" ? "/" : `${s.href}/`)),
    ...PROJECTS.map((p) => `/projects/${p.slug}/`),
  ];
  return paths.map((path) => ({ url: `${SITE_URL}${path}` }));
}
