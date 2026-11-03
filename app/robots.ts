import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/meta";
import { HOME_OPEN } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    // nothing points search engines at the pages while the homepage is closed
    sitemap: HOME_OPEN ? `${SITE_URL}/sitemap.xml` : undefined,
  };
}
