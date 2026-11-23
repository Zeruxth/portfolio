import type { Metadata } from "next";

export const SITE_URL = "https://akiwip.work";

export const NAME = "Aki Yamin";
export const ROLE = "Visual Designer";

/** profiles elsewhere; the About page links them and search engines read them as the same person */
export const PROFILES = {
  linkedin: "https://www.linkedin.com/in/aki-yamin-8a8333357/",
  instagram: "https://www.instagram.com/aki_wip/",
};

/** one page's title, description, canonical address and sharing card; `image` replaces the site's card */
export function pageMeta(
  title: string,
  description: string,
  path: string,
  image?: string,
  type: "website" | "article" = "website",
): Metadata {
  const full = `${title} — ${NAME}`;
  return {
    title: full,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: full,
      description,
      url: path,
      siteName: "AKI_WIP",
      type,
      ...(type === "article" && { authors: [NAME] }),
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

/** stable ids, so every page's structured data points at the same person and site */
export const PERSON_ID = `${SITE_URL}/#person`;
export const SITE_ID = `${SITE_URL}/#website`;

/** who the site is by, read by search engines and AI answers */
export const SITE_GRAPH = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: NAME,
      alternateName: "AKI_WIP",
      jobTitle: ROLE,
      description:
        "Multidisciplinary visual designer based in Tel Aviv, working across print, screen, motion and objects.",
      url: `${SITE_URL}/`,
      address: { "@type": "PostalAddress", addressLocality: "Tel Aviv", addressCountry: "IL" },
      worksFor: { "@type": "Organization", name: "Studio&more" },
      alumniOf: { "@type": "CollegeOrUniversity", name: "Wizo (University of Haifa)" },
      knowsAbout: ["Visual identity", "Branding", "Editorial design", "Illustration", "Motion design", "Web design", "Packaging"],
      sameAs: Object.values(PROFILES),
    },
    {
      "@type": "WebSite",
      "@id": SITE_ID,
      url: `${SITE_URL}/`,
      name: "AKI_WIP",
      author: { "@id": PERSON_ID },
      inLanguage: "en",
    },
  ],
};

/** a JSON-LD script; `<` is escaped so no string in the data can close the tag */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
