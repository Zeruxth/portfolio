/**
 * The Tools page has no inner pages: every tool is a cover, a few lines and one
 * way to get it, set as a case study's project link. `action.kind` says whether it
 * downloads, opens another site in a new tab, or runs here.
 *
 * `image` is a path under /public, 16:10; null falls back to placeholder art.
 * The covers are rendered from exports/tools-covers.
 *
 * TODO(aki): years are PLACEHOLDER.
 */
export interface ToolAction {
  label: string;
  href: string;
  kind: "download" | "external" | "open";
}

export interface Tool {
  slug: string;
  title: string;
  description: string;
  /** what it is, e.g. "Figma plugin" */
  kind: string;
  platform: string;
  year: string;
  image: string | null;
  actions: ToolAction[];
}

export const TOOLS: Tool[] = [
  {
    slug: "chomp",
    title: "Chomp",
    description:
      "A desktop app for quick file conversions and everyday file tasks. Drag a file, tap Shift, and choose a new format, with shortcuts for compressing, editing, and sharing files.",
    kind: "Desktop app",
    platform: "macOS / Windows",
    year: "2026",
    image: "/tools/covers/chomp.png",
    actions: [{ label: "Visit site", href: "https://zeruxth.github.io/Chomp/", kind: "external" }],
  },
  {
    slug: "sharpen-points",
    title: "Sharpen Points",
    description:
      "A Figma plugin that turns curved vector paths into straight lines, making it easy to clean up shapes without redrawing them point by point.",
    kind: "Figma plugin",
    platform: "Figma",
    year: "2026",
    image: "/tools/covers/sharpen-points.jpg",
    actions: [
      {
        label: "Get on Figma",
        href: "https://www.figma.com/community/plugin/1698346150218001765",
        kind: "external",
      },
    ],
  },
  {
    slug: "book-spread",
    title: "Book Spread Mockup",
    description:
      "Turn PDF spreads into animated book mockups. Adjust the book dimensions, remove bleed, and export a ready-to-use video of your book.",
    kind: "Web tool",
    platform: "Browser",
    year: "2025",
    image: "/tools/covers/book-spread.jpg",
    actions: [{ label: "Open", href: "/tools/book-spread/", kind: "open" }],
  },
  {
    slug: "art-downloader",
    title: "Art Downloader",
    description:
      "Search open-access museum and gallery collections by keyword, download full-size artwork images, and generate citations in APA, MLA, or Chicago format. Made to make visual research a little easier.",
    kind: "Web tool",
    platform: "Browser",
    year: "2025",
    image: "/tools/covers/art-downloader.jpg",
    // hosted here, so one click opens it
    actions: [{ label: "Open", href: "/tools/art-downloader/", kind: "open" }],
  },
];
