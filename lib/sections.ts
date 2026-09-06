/** PLACEHOLDER — swap for the address you actually want people mailing. */
export const CONTACT_EMAIL = "hello@akiyamin.com";

export type SectionKey = "home" | "projects" | "about" | "archive";

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
  /** shown on the rule when the measure treatment is on */
  count: string;
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
    count: "",
  },
  {
    key: "projects",
    href: "/projects",
    label: "Selected Projects",
    word: "WORK",
    color: "#E83A3A",
    ink: "#222222",
    explainer:
      "The bigger stuff. Fully developed projects across branding, illustration, print, digital products and motion, with a closer look at the ideas, decisions and details behind each one.",
    count: "12 projects",
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
    count: "Since 2019",
  },
  {
    key: "archive",
    href: "/archive",
    label: "Archive",
    word: "ARCHIVE",
    color: "#E83AD0",
    ink: "#222222",
    explainer:
      "The smaller stuff. Experiments, one-offs, illustrations, moving things and other pieces that never needed a full case study, but still deserved a place of their own.",
    count: "147 things",
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
  0,
);

export function sectionForPath(pathname: string): Section {
  const hit = SECTIONS.find(
    (s) => s.href !== "/" && pathname.startsWith(s.href),
  );
  return hit ?? BY_KEY.home;
}
