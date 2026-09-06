/**
 * Fields come straight from the Selected Projects design (Figma 2098:1297):
 * title, description, disciplines, year and an optional note, plus one image.
 *
 * `image` is a path under /public. One square image per project is enough —
 * the collapsed row shows it at 48px in luminosity blend, the open row at 363px
 * in full colour. Null falls back to generated placeholder art.
 *
 * TODO(aki): titles below are real; everything marked PLACEHOLDER needs your copy.
 */
export interface Project {
  slug: string;
  title: string;
  /** one or two sentences, set in mono under the title */
  description: string;
  /** rendered slash-joined: ["Editorial","Web","Research"] -> EDITORIAL/WEB/RESEARCH */
  disciplines: string[];
  year: string;
  /** optional third metadata line, e.g. "Graduation project" */
  note?: string;
  image: string | null;
}

export const PROJECTS: Project[] = [
  {
    slug: "my-life-is-a-beautiful-attack",
    title: "My life is a beautiful attack",
    description:
      "A research book and interactive website exploring the visual language of monsters.",
    disciplines: ["Editorial", "Web", "Research"],
    year: "2026",
    note: "Graduation project",
    image: null,
  },
  {
    slug: "the-monster-archetype",
    title: "The monster archetype",
    description: "PLACEHOLDER — description needed.",
    disciplines: ["PLACEHOLDER"],
    year: "PLACEHOLDER",
    image: null,
  },
  {
    slug: "zoo-distillery",
    title: "Zoo distillery",
    description: "PLACEHOLDER — description needed.",
    disciplines: ["PLACEHOLDER"],
    year: "PLACEHOLDER",
    image: null,
  },
];

export const INTRO =
  "Hi, I’m Aki Yamin, a multidisciplinary visual designer who likes making cool shit. If it can be printed, clicked, watched or held, I’m probably interested. If it needs more than one of those, even better.";
