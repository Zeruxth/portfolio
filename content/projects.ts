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
  /** the inner page; projects without one fall back to the scaffold */
  study?: CaseStudy;
}

/**
 * One tile in the media column. `ratio` is width / height and is what locks the
 * tile's shape: the column scales with the window and every tile keeps it.
 *
 * `src` is a path under /public. Null draws a labelled placeholder at the right
 * ratio, so the layout (and the sidebar alignment that hangs off it) is already
 * correct before the final exports land.
 */
export type Media =
  | { kind: "image"; label: string; ratio: number; src: string | null }
  | { kind: "video"; label: string; ratio: number; src: string | null; poster?: string };

/** one or two tiles side by side */
export type MediaRow = Media[];

/**
 * A sidebar block and the rows it belongs to. The block's top lines up with the
 * top of its first row, then sticks and stacks as you scroll past.
 */
export interface Chapter {
  label: string;
  text: string;
  rows: MediaRow[];
}

export interface CaseStudy {
  /** the long description under the title */
  summary: string;
  link?: { label: string; href: string };
  /** rows shown beside the title block, before the first chapter */
  intro: MediaRow[];
  chapters: Chapter[];
}

/** Figma's wide slides: 809 x 424 */
const WIDE = 809 / 424;

const img = (label: string, ratio = 1): Media => ({ kind: "image", label, ratio, src: null });

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
    // meta and copy below are from the inner page, Figma 2123:4301
    disciplines: ["Editorial", "Web", "Research"],
    year: "2026",
    note: "Graduation project",
    image: null,
    study: {
      summary:
        "A research-based visual project exploring how monsters are depicted across cultures, and the recurring traits that shape the idea of the “monster.” Drawing on Rorschach as a way of looking at projection and interpretation, the project connects mythology, emotion and the way we continue to create monsters today.",
      // TODO(aki): real URL
      link: { label: "Link to the project", href: "#" },
      // TODO(aki): export each tile from Figma into
      // public/projects/the-monster-archetype/ and set its src
      intro: [
        [img("Glyphs", WIDE)],
        [img("Rorschach"), img("Emotions")],
      ],
      chapters: [
        {
          label: "The book",
          text: "The 296-page book brings the research together through a sequence of monsters, cultures and emotions. Historical imagery and academic research sit alongside original illustrations and Rorschach-inspired forms, using the visual language of the project to move between studying the monster and interpreting it.",
          rows: [
            [img("Book — cover", WIDE)],
            [img("Spread A"), img("Spread B")],
            [img("Spread C"), img("Spread D")],
            [img("Book — open", WIDE)],
            [img("Spread E"), img("Spread F")],
          ],
        },
        {
          label: "The website",
          text: "The website extends the project into a more personal and interactive experience. A Rorschach-inspired test asks visitors to interpret ambiguous forms, while a visual guide and research section let them explore the monsters, emotions and ideas behind the project in different ways.",
          rows: [
            [img("Website", WIDE)],
            [img("Screen A"), img("Screen B")],
            [img("Social preview", WIDE)],
          ],
        },
      ],
    },
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
