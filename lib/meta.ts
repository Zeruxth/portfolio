import type { Metadata } from "next";

export const SITE_URL = "https://akiwip.work";

/** one page's title, description, canonical address and sharing card; `image` replaces the site's card */
export function pageMeta(title: string, description: string, path: string, image?: string): Metadata {
  const full = `${title} — AKI_WIP`;
  return {
    title: full,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: full,
      description,
      url: path,
      siteName: "AKI_WIP",
      type: "website",
      images: [image ?? "/opengraph-image.png"],
    },
    twitter: {
      card: image ? "summary" : "summary_large_image",
      title: full,
      description,
      images: [image ?? "/twitter-image.png"],
    },
  };
}
