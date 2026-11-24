export const CONTACT_EMAIL = "akiwipz@gmail.com";

/** where both Let’s talk rows lead; not a menu section, so no row of its own */
export const CONTACT_HREF = "/contact";

/**
 * The forms Worker (worker/). `next dev` talks to `wrangler dev` on 8790, so a
 * test message never reaches the real inbox or database.
 */
export const FORMS_ENDPOINT =
  process.env.NEXT_PUBLIC_FORMS_ENDPOINT ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:8790/submit"
    : "https://api.akiwip.work/submit");

/** the brand questionnaire; unlisted, sent to clients as a link */
export const QUESTIONNAIRE_HREF = "/questionnaire";

/** pages that belong to no menu section: each opens its own tab and shows no band */
export const FORM_PAGES = [
  { id: "contact", href: CONTACT_HREF, label: "Contact" },
  { id: "questionnaire", href: QUESTIONNAIRE_HREF, label: "Questionnaire" },
] as const;

export function formPageFor(pathname: string) {
  const path = pathname.replace(/\/+$/, "");
  return FORM_PAGES.find((p) => p.href === path) ?? null;
}

export function isContactPath(pathname: string): boolean {
  return formPageFor(pathname)?.id === "contact";
}

export type SectionKey = "home" | "projects" | "about" | "smaller" | "tools";

export interface Section {
  key: SectionKey;
  href: string;
  label: string;
  /** the word that replaces WIP in the band */
  word: string;
  /** hover ground, from the HOVER STATES frame (2074:819) */
  color: string;
  /** text on that ground */
  ink: string;
  /** null means the row hovers to the arrow only, with no explainer */
  explainer: string | null;
}

export const SECTIONS: Section[] = [
  {
    key: "home",
    href: "/",
    label: "Home",
    word: "WIP",
    color: "#222222",
    ink: "#DEDEDE",
    explainer: null,
  },
  {
    key: "projects",
    href: "/projects",
    label: "Projects",
    word: "WORK",
    color: "#E83A3A",
    ink: "#222222",
    explainer:
      "A closer look at some of the projects I’ve worked on, and all the thinking and making that went into them.",
  },
  {
    key: "about",
    href: "/about",
    label: "About",
    word: "ABOUT",
    color: "#199329",
    ink: "#222222",
    explainer:
      "A little more about me, what I do, the things I like making and how I ended up working across so many different parts of visual design.",
  },
  {
    key: "smaller",
    href: "/smaller-projects",
    label: "Smaller projects",
    word: "SMALL",
    color: "#E83AD0",
    ink: "#222222",
    explainer:
      "One-offs, and other things worth sharing without the whole case study.",
  },
  {
    key: "tools",
    href: "/tools",
    label: "Tools",
    word: "TOOLS",
    color: "#E35D31",
    ink: "#222222",
    explainer:
      "Little things I built because I needed them, got curious, or just wanted to see if I could. Some are useful, some are just fun. Feel free to give them a try.",
  },
];

export const BY_KEY = Object.fromEntries(
  SECTIONS.map((s) => [s.key, s]),
) as Record<SectionKey, Section>;

/** IBM Plex Mono advance width, in em. The band's geometry is arithmetic because of it. */
export const MONO_ADVANCE = 0.6;

/** "AKI" */
export const PREFIX = "AKI";

/**
 * The band's type size is fixed: it never changes between sections, only the rule does.
 * That means the size is set by the LONGEST word, so it has to be known up front.
 */
export const LONGEST_WORD = SECTIONS.reduce(
  (n, s) => Math.max(n, s.word.length),
  // the band was drawn around ARCHIVE; holding its seven letters keeps the size
  // where it was now that every word is shorter
  7,
);

export function sectionForPath(pathname: string): Section {
  const hit = SECTIONS.find(
    (s) => s.href !== "/" && pathname.startsWith(s.href),
  );
  return hit ?? BY_KEY.home;
}
