/**
 * PLACEHOLDER. Titles, years and counts are invented — swap for the real work.
 * `cover` is null until real stills exist; the placeholder generator fills in.
 */
export interface Project {
  slug: string;
  title: string;
  year: string;
  discipline: string;
  cover: string | null;
}

export const PROJECTS: Project[] = [
  { slug: "night-market", title: "Night Market Identity", year: "2026", discipline: "Identity", cover: null },
  { slug: "signal-noise", title: "Signal / Noise", year: "2025", discipline: "Motion", cover: null },
  { slug: "haifa-type-week", title: "Haifa Type Week", year: "2025", discipline: "Print", cover: null },
  { slug: "tape-deck-03", title: "Tape Deck 03", year: "2024", discipline: "Packaging", cover: null },
  { slug: "moth-club", title: "Moth Club Posters", year: "2023", discipline: "Print", cover: null },
  { slug: "red-line", title: "Red Line Signage", year: "2021", discipline: "Wayfinding", cover: null },
];

export const INTRO =
  "Hi, I’m Aki Yamin, a multidisciplinary visual designer who likes making cool shit. If it can be printed, clicked, watched or held, I’m probably interested. If it needs more than one of those, even better.";
