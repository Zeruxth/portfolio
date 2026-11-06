"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BANDS, NARROW_BANDS, WIDE_BANDS } from "@/content/small-projects";
import type { BandItem, SmallImage, SmallProject } from "@/content/small-projects";
import { Arrow } from "./icons";
import c from "./CaseStudy.module.css";
import p from "./ProjectList.module.css";
import s from "./SmallGrid.module.css";

// files live under /public, which Pages serves below the base path
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/* ---- a tile's shape ---- */

/** the layout width to work from before the page has measured itself */
const DESIGN_WIDTH = 1110;
const PAD = 16;
/** between images: half the padding, so a set reads as one thing inside its frame */
const GAP = 8;
/** between the images and the opened text */
const TEXT_GAP = 16;
/**
 * The caption's height. Wide, every caption is this tall, title and tags beside the
 * corner square. On a phone-width grid the caption is one line, the title and a
 * "+N" (SmallGrid.module.css, [data-compact]), hugging its text. Those heights
 * are measured on the page; this is the guess before they are.
 */
const CAPTION = 102;
const CAPTION_COMPACT = 30;
/** below this grid width the captions go compact */
const COMPACT = 700;
const captionFor = (width: number) => (width < COMPACT ? CAPTION_COMPACT : CAPTION);
/** the padding, the gap under the images and the caption around a tile's images */
const chromeFor = (caption: number) => PAD * 2 + 8 + caption;

const ratioOf = (row: SmallImage[]) => row.reduce((sum, image) => sum + image.w / image.h, 0);

/** the images a tile shows, by the row counts in the content */
function rowsOf(project: SmallProject) {
  let next = 0;
  return project.rows.map((count) => project.images.slice(next, (next += count)));
}

/* ---- where the tiles go ---- */

/**
 * Every tile's height follows from its width: H = a * W + b. With every image at its
 * own shape, a row of them is as tall as its width over the sum of their ratios, so
 * a tile's images add up to a straight line, and the caption is a constant on top.
 * Lines combine exactly: tiles stacked add up, and tiles side by side share a height.
 * So a whole band can be solved for the page's width with nothing cropped or left over.
 */
type Line = { a: number; b: number };

function lineOf(project: SmallProject, caption: number): Line {
  const rows = rowsOf(project);
  const a = rows.reduce((sum, row) => sum + 1 / ratioOf(row), 0);
  const gaps =
    GAP * (rows.length - 1) - rows.reduce((sum, row) => sum + (GAP * (row.length - 1)) / ratioOf(row), 0);
  return { a, b: gaps + chromeFor(caption) - PAD * 2 * a };
}

const stacked = (lines: Line[]): Line => ({
  a: lines.reduce((sum, l) => sum + l.a, 0),
  b: lines.reduce((sum, l) => sum + l.b, 0),
});

const sideBySide = (lines: Line[]): Line => {
  const a = 1 / lines.reduce((sum, l) => sum + 1 / l.a, 0);
  return { a, b: a * lines.reduce((sum, l) => sum + l.b / l.a, 0) };
};

type Rect = { x: number; y: number; w: number; h: number };
type Lines = Record<string, Line>;

/** an item's line: a list side by side, or stacked, turn about as they nest */
const lineOfItem = (item: BandItem, lines: Lines, across = false): Line => {
  if (typeof item === "string") return lines[item];
  const parts = item.map((part) => lineOfItem(part, lines, !across));
  return across ? sideBySide(parts) : stacked(parts);
};

const bandLine = (band: BandItem[], lines: Lines) => lineOfItem(band, lines, true);
const flatten = (item: BandItem): string[] => (typeof item === "string" ? [item] : item.flatMap(flatten));

/** fills a box with an item, giving each part the size its line says */
function fill(item: BandItem, box: Rect, across: boolean, lines: Lines, rects: Record<string, Rect>) {
  if (typeof item === "string") {
    rects[item] = box;
    return;
  }
  let along = across ? box.x : box.y;
  for (const part of item) {
    const line = lineOfItem(part, lines, !across);
    const size = across ? (box.h - line.b) / line.a : line.a * box.w + line.b;
    fill(part, across ? { ...box, x: along, w: size } : { ...box, y: along, h: size }, !across, lines, rects);
    along += size;
  }
}

/** lays one band out from (0, y), filling the width, and returns how tall it came out */
function placeBand(band: BandItem[], width: number, y: number, lines: Lines, rects: Record<string, Rect>) {
  const line = bandLine(band, lines);
  const h = line.a * width + line.b;
  fill(band, { x: 0, y, w: width, h }, true, lines, rects);
  return h;
}

/** the narrowest a tile can go with its title, on two lines at most, beside its tags */
function narrowest(project: SmallProject) {
  const words = project.title.split(" ");
  const lineLength = words.reduce(
    (best, _, i) =>
      i === 0
        ? best
        : Math.min(best, Math.max(words.slice(0, i).join(" ").length, words.slice(i).join(" ").length)),
    project.title.length,
  );
  const tags = Math.max(...project.tags.map((tag, i) => tag.length + (i < project.tags.length - 1 ? 2 : 0))) * 8.4;
  return PAD * 2 + 16 + lineLength * 16 + tags;
}

/** does every tile in this band keep its caption whole at this width? */
function fits(band: BandItem[], width: number, lines: Lines, mins: Record<string, number>) {
  const rects: Record<string, Rect> = {};
  placeBand(band, width, 0, lines, rects);
  return Object.entries(rects).every(([slug, r]) => r.w >= mins[slug]);
}

/** every choice of up to `most` of these, keeping their order */
function subsets(items: string[], most: number): string[][] {
  const found: string[][] = [];
  const grow = (from: number, picked: string[]) => {
    if (picked.length) found.push(picked);
    if (picked.length === most) return;
    for (let i = from; i < items.length; i++) grow(i + 1, [...picked, items[i]]);
  };
  grow(0, []);
  return found;
}

/** how tall a band aims to be at this width, when it's the layout's call */
const bandTarget = (width: number) => Math.min(Math.max(width * 0.45, 460), 640);

/**
 * Bands for any tiles at any width: each takes tiles in order until it's short enough.
 * A tile that wouldn't fit waits for the next band, and a later one that does fit comes
 * forward instead, so a wide tile finds a partner rather than running the whole width.
 * A tile left over at the end joins the band before it.
 */
/** finds a tile left over at the end a place: in a band it fits, or beside the last tile before it */
function settleLone(slug: string, bands: BandItem[][], width: number, lines: Lines, mins: Record<string, number>) {
  for (let i = bands.length - 1; i >= 0; i--) {
    if (fits([...bands[i], slug], width, lines, mins)) {
      bands[i].push(slug);
      return;
    }
  }
  const last = bands[bands.length - 1];
  const stacked = [...last.slice(0, -1), [last[last.length - 1], slug]];
  if (fits(stacked, width, lines, mins)) {
    bands[bands.length - 1] = stacked;
    return;
  }
  const pair = [last[last.length - 1], slug];
  if (last.length > 1 && fits(pair, width, lines, mins)) last.pop();
  bands.push(last.includes(pair[0]) ? [slug] : pair);
}

function compose(slugs: string[], width: number, lines: Lines, mins: Record<string, number>) {
  const bands: BandItem[][] = [];
  const waiting = [...slugs];
  while (waiting.length) {
    const band = [waiting.shift()!];
    for (let i = 0; i < waiting.length; ) {
      const line = bandLine(band, lines);
      if (line.a * width + line.b <= bandTarget(width)) break;
      if (fits([...band, waiting[i]], width, lines, mins)) band.push(...waiting.splice(i, 1));
      else i++;
    }
    // on anything wider than a phone a lone tile would run the whole width, far too big
    if (band.length === 1 && !waiting.length && bands.length && width >= 520) settleLone(band[0], bands, width, lines, mins);
    else bands.push(band);
  }
  return bands;
}

interface OpenTile {
  slug: string;
  left: boolean;
  /** how its height follows its width, images and text together */
  line: Line;
  /** the same from an estimate of the text, so the choice of neighbours can't flip as it's measured */
  pick: Line;
  /** how much bigger its images come out at a width, against the tile they came from, and the least that's worth it */
  scale: (width: number) => number;
  leastScale: number;
  /** how much it's worth avoiding having the whole width to itself */
  aloneCost: number;
  /** how much of the screen's height it aims for */
  size: number;
  /** the whole width to itself: its height there, and whether it has to */
  aloneH: number;
  mustBeAlone: boolean;
}

/**
 * The page's bands, top to bottom. Opening a tile is there to show its images bigger,
 * so it fills the screen's height if it can, and never stays close to the tile's size.
 * It shares a band with the tiles after it where that leaves it big enough, solved like
 * any other band so they come out the same height. If not, it takes the whole width.
 * Whatever's left then re-fills the width as new bands underneath.
 */
function layout(
  bands: BandItem[][],
  width: number,
  screen: number,
  lines: Lines,
  mins: Record<string, number>,
  open?: OpenTile,
) {
  const rects: Record<string, Rect> = {};
  let y = 0;
  let rest = bands;
  const at = open ? bands.findIndex((band) => flatten(band).includes(open.slug)) : -1;

  if (open && at >= 0) {
    bands.slice(0, at).forEach((band) => {
      y += placeBand(band, width, y, lines, rects);
    });

    const after = bands.slice(at).flatMap(flatten).filter((slug) => slug !== open.slug);
    const picking = { ...lines, [open.slug]: open.pick };
    const goal = screen * 0.96 * open.size;
    const miss = (h: number) => (h > goal ? ((h - goal) / goal) * 1.5 : (goal - h) / goal);
    let best: { stacks: string[][]; score: number } | null = null;
    if (!open.mustBeAlone) {
      // any of the next tiles can move up beside it, a little dearer the further down it comes from
      const near = after.slice(0, 8);
      for (const picked of subsets(near, 4)) {
        for (const columns of [1, 2]) {
          if (picked.length < columns) continue;
          const each = Math.ceil(picked.length / columns);
          const stacks: string[][] = [];
          for (let i = 0; i < picked.length; i += each) stacks.push(picked.slice(i, i + each));
          const band: BandItem[] = [open.slug, ...stacks];
          const h = bandLine(band, picking).a * width + bandLine(band, picking).b;
          const w = (h - open.pick.b) / open.pick.a;
          if (w < Math.max(width * 0.5 * open.size, 420) || open.scale(w) < open.leastScale) continue;
          if (!fits(stacks, width - w, lines, mins)) continue;
          const skipped = near.indexOf(picked[picked.length - 1]) + 1 - picked.length;
          const score = miss(h) + skipped * 0.02;
          if (!best || score < best.score) best = { stacks, score };
        }
      }
    }

    // sharing the band is what makes the grid act around it, so it gets the benefit of the doubt
    let taken: string[] = [];
    if (best && best.score <= miss(open.aloneH) + open.aloneCost) {
      const band: BandItem[] = open.left ? [open.slug, ...best.stacks] : [...best.stacks, open.slug];
      y += placeBand(band, width, y, { ...lines, [open.slug]: open.line }, rects);
      taken = best.stacks.flat();
    } else {
      rects[open.slug] = { x: 0, y, w: width, h: open.aloneH };
      y += open.aloneH;
    }

    // what's left of the bands it broke up fills the width again; the rest stay as composed
    const later = bands.slice(at + 1);
    let lastTouched = -1;
    later.forEach((band, i) => {
      if (flatten(band).some((slug) => taken.includes(slug))) lastTouched = i;
    });
    const untouched = later.slice(lastTouched + 1);
    let loose = after.filter((slug) => !taken.includes(slug)).slice(0, after.length - taken.length - untouched.flatMap(flatten).length);
    // a tile left on its own would run the whole width, so it joins the next band
    while (loose.length === 1 && untouched.length) loose = [...loose, ...flatten(untouched.shift()!)];
    rest = [...compose(loose, width, lines, mins), ...untouched];
  }

  rest.forEach((band) => {
    y += placeBand(band, width, y, lines, rects);
  });

  // whole pixels, so neighbours share a rule; each edge rounds once, so nothing gaps
  for (const r of Object.values(rects)) {
    const right = Math.round(r.x + r.w);
    const bottom = Math.round(r.y + r.h);
    r.x = Math.round(r.x);
    r.y = Math.round(r.y);
    r.w = right - r.x;
    r.h = bottom - r.y;
  }
  return { rects, height: Math.round(y) };
}

/* ---- what's written on a tile ---- */

/** the case study's tags: spaced slashes, and a tag never splits */
function Tags({ tags }: { tags: string[] }) {
  return (
    <span className={c.meta}>
      <span>
        {tags.map((tag, k) => (
          <span key={tag}>
            <span className={c.tag}>
              {tag}
              {k < tags.length - 1 && "\u00a0/"}
            </span>{" "}
          </span>
        ))}
      </span>
    </span>
  );
}

/* ---- the opened project's images ---- */

const src = (image: SmallImage) => `${BASE}${image.src}`;

/** the project's name, and which of its images this is when it has several */
function altFor(project: SmallProject, image: SmallImage) {
  const { title, images } = project;
  return images.length > 1 ? `${title}, image ${images.indexOf(image) + 1} of ${images.length}` : title;
}

/** an image or video at its own shape; given no width, it takes its share of the row */
function Img({ image, alt, width }: { image: SmallImage; alt: string; width?: number }) {
  const ratio = image.w / image.h;
  const style =
    width === undefined ? { aspectRatio: ratio, flexGrow: ratio * 100 } : { aspectRatio: ratio, width, flex: "none" };
  if (image.video) return <LoopVideo image={image} alt={alt} style={style} />;
  return <img style={style} src={src(image)} alt={alt} draggable={false} decoding="async" />;
}

/** a muted loop, playing only while it's near the screen, as in the case studies */
function LoopVideo({ image, alt, style }: { image: SmallImage; alt: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      style={style}
      src={`${BASE}${image.video}`}
      poster={src(image)}
      aria-label={alt}
      preload="metadata"
      muted
      loop
      playsInline
    />
  );
}

/**
 * An opened project's composition: rows of columns of images. Each row's height, and
 * so each column's width, follows from its images, so none is cropped and every
 * column ends level. This is the tile's line again, one level down.
 */
type Composition = SmallImage[][][];

const columnRatio = (column: SmallImage[]) => 1 / column.reduce((sum, image) => sum + image.h / image.w, 0);

function rowShape(row: SmallImage[][]) {
  const ratio = row.reduce((sum, column) => sum + columnRatio(column), 0);
  const slack =
    GAP * row.reduce((sum, column) => sum + (column.length - 1) * columnRatio(column), 0) - GAP * (row.length - 1);
  return { ratio, slack };
}

function compositionOf(project: SmallProject, plan: number[][]): Composition {
  let next = 0;
  return plan.map((row) => row.map((count) => project.images.slice(next, (next += count))));
}

/** the composition's height as a line in its width */
function compositionLine(rows: Composition): Line {
  return rows.reduce(
    (line, row) => {
      const { ratio, slack } = rowShape(row);
      return { a: line.a + 1 / ratio, b: line.b + slack / ratio };
    },
    { a: 0, b: GAP * (rows.length - 1) },
  );
}

const columnWidth = (row: SmallImage[][], column: SmallImage[], width: number) => {
  const { ratio, slack } = rowShape(row);
  const h = (width + slack) / ratio;
  return (h - GAP * (column.length - 1)) * columnRatio(column);
};

function Mosaic({ project, rows, width }: { project: SmallProject; rows: Composition; width: number }) {
  return (
    <div className={s.mosaic}>
      {rows.map((row, i) => (
        <div key={i} className={s.mosaicRow}>
          {row.map((column) => (
            <div key={column[0].src} className={s.mosaicColumn}>
              {column.map((image) => (
                <Img key={image.src} image={image} alt={altFor(project, image)} width={columnWidth(row, column, width)} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** the text, with its link if it has one; following the link doesn't close the tile */
function Description({ project }: { project: SmallProject }) {
  const { description, link } = project;
  if (!link) return description;
  const [before, after] = description.split(link.text);
  return (
    <>
      {before}
      <a
        className={c.inlineLink}
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        {link.text}
      </a>
      {after}
    </>
  );
}

const TEXT_BESIDE = 280;
const each = (images: SmallImage[], count: number) =>
  images.flatMap((_, i) => (i % count ? [] : [images.slice(i, i + count).map(() => 1)]));

/** a narrow window has no room for the composition: the images in rows of two, or one */
const narrowPlan = (project: SmallProject, width: number) => each(project.images, width < 520 ? 1 : 2);

/**
 * How an opened project sits: its composition, and its text under it if it's wide, or
 * beside it if not. Its height follows its width like a tile's does, so it can share a
 * band with the tiles around it. `extra` is the text's part, measured on the page.
 */
function openShapeOf(project: SmallProject, width: number, screen: number, extra: number, tileWidth: number) {
  const rows = compositionOf(project, width < 820 ? narrowPlan(project, width) : project.open);
  const { a, b: gaps } = compositionLine(rows);
  const edge = PAD * 2 + 1;
  const single = project.open.flat().length === 1 && project.images.length === 1;

  const inTile = rowsOf(project).flatMap((row) =>
    row.map((image) => ((tileWidth - edge - GAP * (row.length - 1)) * (image.w / image.h)) / ratioOf(row)),
  );
  const tileAverage = inTile.reduce((sum, w) => sum + w, 0) / inTile.length;
  const growth = (imagesWidth: number) => {
    const widths = rows.flatMap((row) => row.flatMap((column) => column.map(() => columnWidth(row, column, imagesWidth))));
    return widths.reduce((sum, x) => sum + x, 0) / widths.length / tileAverage;
  };

  // text beside a tall composition, unless the room it takes would stop the images growing
  const besideRoom = edge + TEXT_GAP + TEXT_BESIDE;
  const beside = (width >= 820 || (single && width >= 640)) && 1 / a < 1.6 && (single || growth(width - besideRoom) >= 1.15);
  const around = beside ? besideRoom : edge;
  const under = (text: number): Line => ({ a, b: gaps + text + 1 - a * edge });
  const line = beside ? { a, b: gaps + edge - a * around } : under(extra);
  // padding, gap, title and gap, then the text's lines at the width it's likely to get
  const textLines = Math.ceil((project.description.length * 11) / Math.min(708, width * 0.64 - 33));
  const pick = beside ? line : under(PAD * 2 + TEXT_GAP + 54 + textLines * 23.4 + (project.site ? 38 : 0));

  // with the whole width, one image stops at a screenful, unless the tile was already that big
  const tallest = Math.max(280, screen * 0.96 * (project.openSize ?? 1) - edge);
  const aloneWidth = single
    ? Math.min(width - around, Math.max((tallest - gaps) / a, tileAverage * 1.25))
    : width - around;
  const aloneH = beside ? a * aloneWidth + gaps + edge : line.a * width + line.b;

  return {
    rows,
    beside,
    line,
    pick,
    aloneH,
    aloneWidth,
    around,
    scale: (w: number) => growth(w - around),
    leastScale: single ? 1.15 : 1.25,
    size: project.openSize ?? 1,
    // a lone image with the whole row leaves its text beside a lot of nothing
    aloneCost: single && beside ? 0.3 : 0.1,
    mustBeAlone: width < 820,
  };
}

/**
 * The images bigger, and the text; the band it sits in is solved to fit them exactly.
 * A second click anywhere on it closes it.
 */
function Opened({
  project,
  shape,
  width,
  alone,
  onClose,
}: {
  project: SmallProject;
  shape: ReturnType<typeof openShapeOf>;
  width: number;
  alone: boolean;
  onClose: () => void;
}) {
  const imagesWidth = alone ? shape.aloneWidth : width - shape.around;
  return (
    <div
      className={s.opened}
      data-opened
      onClick={() => {
        // selecting the text isn't a click to close
        if (!window.getSelection()?.toString()) onClose();
      }}
    >
      <div className={s.flow} data-flow data-beside={shape.beside}>
        <div className={s.images} data-images style={{ width: imagesWidth }}>
          <Mosaic project={project} rows={shape.rows} width={imagesWidth} />
        </div>
        <div className={s.openCaption}>
          <div className={s.line}>
            <h2 className={p.title}>{project.title}</h2>
            <span className={s.tags}>
              <Tags tags={project.tags} />
            </span>
          </div>
          <p className={c.text}>
            <Description project={project} />
          </p>
          {project.site && (
            <a
              className={c.link}
              href={project.site.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {project.site.label}
            </a>
          )}
          {/* keyboards and screen readers still get a way out */}
          <button type="button" className={s.closeHidden} onClick={onClose}>
            Close {project.title}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- the grid ---- */

const MOVE = { duration: 720, easing: "cubic-bezier(0.65, 0, 0.35, 1)" };

type Seen = { card: Rect; images: Map<string, Rect> };
type Before = { cards: Map<string, Seen>; scroll: number; ghost: HTMLElement | null; ghostOf: string | null };

const rectIn = (el: Element, origin: DOMRect): Rect => {
  const r = el.getBoundingClientRect();
  return { x: r.x - origin.x, y: r.y - origin.y, w: r.width, h: r.height };
};

const same = (a: Rect, b: Rect) =>
  Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && Math.abs(a.w - b.w) < 0.5 && Math.abs(a.h - b.h) < 0.5;

/** what's showing in a card: its opened view, or the tile */
const shownIn = (card: Element) => card.querySelector("[data-opened]") ?? card.querySelector("[data-face]");

/**
 * The tiles are placed by pack() and laid out by CSS grid, so a tile's place is
 * always known. A change plays from where everything was to where it landed,
 * all on one curve: tiles slide on transforms alone, and an image that's in both
 * the tile and the opened view travels from one to the other as the same image.
 */
export default function SmallGrid({ projects }: { projects: SmallProject[] }) {
  const [anchor, setAnchor] = useState<{ slug: string; left: boolean } | null>(null);
  // the opened view's height beyond its images: padding, title and text, measured on the page
  const [openExtra, setOpenExtra] = useState(190);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [width, setWidth] = useState<number | null>(null);
  const [screen, setScreen] = useState(870);

  const scroller = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const before = useRef<Before | null>(null);
  const settling = useRef({ key: "", tries: 0 });

  const openAt = projects.findIndex((p) => p.slug === anchor?.slug);
  const opened = openAt < 0 ? null : projects[openAt];
  const space = width ?? DESIGN_WIDTH;

  const caption = captionFor(space);
  const compact = caption === CAPTION_COMPACT;
  // each compact caption's own height, measured; missing until it has been
  const [captions, setCaptions] = useState<Record<string, number>>({});
  const captionsSettling = useRef({ key: "", tries: 0 });
  const lines = useMemo(
    () =>
      Object.fromEntries(
        projects.map((p) => [p.slug, lineOf(p, compact ? captions[p.slug] ?? caption : caption)]),
      ) as Lines,
    [projects, caption, compact, captions],
  );
  const mins = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.slug, narrowest(p)])) as Record<string, number>,
    [projects],
  );
  // the composed bands where they suit this width; otherwise the layout works them out
  const bands = useMemo(() => {
    const composed = (space >= 1400 ? [WIDE_BANDS, BANDS, NARROW_BANDS] : [BANDS, NARROW_BANDS]).find((bands) =>
      bands.every((band) => fits(band, space, lines, mins)),
    );
    if (composed) return composed;
    return compose(BANDS.flatMap(flatten), space, lines, mins);
  }, [space, lines, mins]);
  // where every tile sits closed, which is what an opened project has to out-size
  const closed = useMemo(() => layout(bands, space, screen, lines, mins).rects, [bands, space, screen, lines, mins]);
  const shape = useMemo(
    () => (opened ? openShapeOf(opened, space, screen, openExtra, closed[opened.slug].w) : null),
    [opened, space, screen, openExtra, closed],
  );
  const { rects, height } = useMemo(
    () =>
      layout(
        bands,
        space,
        screen,
        lines,
        mins,
        anchor && shape
          ? {
              slug: anchor.slug,
              left: anchor.left,
              line: shape.line,
              pick: shape.pick,
              scale: shape.scale,
              leastScale: shape.leastScale,
              aloneCost: shape.aloneCost,
              size: shape.size,
              aloneH: shape.aloneH,
              mustBeAlone: shape.mustBeAlone,
            }
          : undefined,
      ),
    [bands, space, screen, lines, mins, anchor, shape],
  );

  /** where everything is on screen right now, mid-animation included */
  const remember = () => {
    const el = grid.current;
    const box = scroller.current;
    if (!el || !box) return;
    const origin = el.getBoundingClientRect();
    const cards = new Map<string, Seen>();
    let ghost: HTMLElement | null = null;
    let ghostOf: string | null = null;
    el.querySelectorAll<HTMLElement>("[data-cell]").forEach((cell) => {
      const card = cell.firstElementChild as HTMLElement;
      const cardRect = card.getBoundingClientRect();
      const images = new Map<string, Rect>();
      shownIn(card)
        ?.querySelectorAll("img, video")
        .forEach((img) => images.set(img.getAttribute("src")!, rectIn(img, cardRect)));
      cards.set(cell.dataset.cell!, { card: rectIn(card, origin), images });
      const opened = card.querySelector<HTMLElement>("[data-opened]");
      if (opened) {
        // the opened view stays a moment as a copy, fading as the tile closes over it
        ghost = opened.cloneNode(true) as HTMLElement;
        ghost.removeAttribute("data-opened");
        ghost.querySelector("[data-flow]")?.removeAttribute("data-flow");
        ghost.setAttribute("aria-hidden", "true");
        ghost.inert = true;
        ghostOf = cell.dataset.cell!;
      }
    });
    before.current = { cards, scroll: box.scrollTop, ghost, ghostOf };
  };

  const change = (apply: () => void) => {
    remember();
    apply();
  };

  const close = () => change(() => setAnchor(null));

  /** the tile opens where it is: toward the edge it's nearest, or the side of it you tapped */
  const open = (slug: string, e: React.MouseEvent) => {
    const box = e.currentTarget.getBoundingClientRect();
    const here = rects[slug];
    const middle = here.x > 1 && here.x + here.w < space - 1;
    const left = middle
      ? e.detail === 0 || e.clientX < box.x + box.width / 2
      : here.x <= 1;
    change(() => setAnchor({ slug, left }));
  };

  // a compact caption is as tall as its text wrapped at its tile's width. That width
  // can follow the height when tiles share a band, so it gets a few tries per width
  useLayoutEffect(() => {
    const el = grid.current;
    if (!el || !compact) return;
    const found: Record<string, number> = {};
    el.querySelectorAll<HTMLElement>("[data-caption]").forEach((c) => {
      found[c.dataset.caption!] = Math.ceil(c.getBoundingClientRect().height);
    });
    const changed = Object.entries(found).some(([slug, h]) => Math.abs((captions[slug] ?? -9) - h) > 0.5);
    const key = `${space}|${fontsLoaded}`;
    if (captionsSettling.current.key !== key) captionsSettling.current = { key, tries: 0 };
    if (changed && captionsSettling.current.tries < 4) {
      captionsSettling.current.tries += 1;
      setCaptions(found);
    }
  });

  useLayoutEffect(() => {
    const el = grid.current;
    const box = scroller.current;
    if (!el || !box) return;

    // the text's share of the opened tile is only known once it's on the page. Setting
    // it here happens before anything paints, and this effect runs again with the right one.
    const flow = el.querySelector<HTMLElement>("[data-flow]");
    const images = flow?.querySelector<HTMLElement>("[data-images]");
    if (flow && images && flow.dataset.beside !== "true") {
      const extra = flow.offsetHeight - images.offsetHeight;
      // a new width can rewrap the text and change the height back again, so it gets
      // a few tries, then holds the larger, which never cuts the text off
      const key = `${anchor?.slug}|${space}|${screen}`;
      if (settling.current.key !== key) settling.current = { key, tries: 0 };
      if (Math.abs(extra - openExtra) > 1 && settling.current.tries < 3) {
        settling.current.tries += 1;
        setOpenExtra(settling.current.tries === 3 ? Math.max(extra, openExtra) : extra);
        return;
      }
    }

    const prev = before.current;
    before.current = null;
    if (!prev) return;

    const cells = [...el.querySelectorAll<HTMLElement>("[data-cell]")];
    cells.forEach((cell) => {
      cell.style.zIndex = "";
      cell.firstElementChild!.querySelectorAll("[data-ghost]").forEach((g) => g.remove());
      cell.firstElementChild!.getAnimations({ subtree: true }).forEach((a) => {
        if (!(a instanceof CSSAnimation)) a.cancel();
      });
    });

    const openCell = flow?.closest<HTMLElement>("[data-cell]");
    if (openCell && anchor?.slug !== prev.ghostOf) {
      // only scrolls if the opened tile doesn't fit where it is
      const view = box.getBoundingClientRect();
      const r = openCell.getBoundingClientRect();
      if (r.top < view.top || r.height > view.height) box.scrollTop += r.top - view.top;
      else if (r.bottom > view.bottom) box.scrollTop += r.bottom - view.bottom;
    }

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // the scroll joins the same move, so nothing jumps when it changes
    const scrolled = box.scrollTop - prev.scroll;
    const origin = el.getBoundingClientRect();
    cells.forEach((cell) => {
      const key = cell.dataset.cell!;
      const seen = prev.cards.get(key);
      if (!seen) return;
      const card = cell.firstElementChild as HTMLElement;
      const to = rectIn(card, origin);
      const from = { ...seen.card, y: seen.card.y + scrolled };
      const resized = Math.abs(from.w - to.w) > 0.5 || Math.abs(from.h - to.h) > 0.5;
      if (same(from, to)) return;

      if (cell === openCell) cell.style.zIndex = "2";
      else if (resized) cell.style.zIndex = "1";

      const start: Keyframe = { transform: `translate(${from.x - to.x}px, ${from.y - to.y}px)` };
      const end: Keyframe = { transform: "none" };
      if (resized) {
        start.width = `${from.w}px`;
        start.height = `${from.h}px`;
        end.width = `${to.w}px`;
        end.height = `${to.h}px`;
      }
      const move = card.animate([start, end], MOVE);
      move.onfinish = () => {
        if (cell !== openCell) cell.style.zIndex = "";
      };
      if (!resized) return;

      // inside a card that's changing size, its images travel from their old boxes
      const cardRect = card.getBoundingClientRect();
      shownIn(card)
        ?.querySelectorAll<HTMLElement>("img, video")
        .forEach((img) => {
          const old = seen.images.get(img.getAttribute("src")!);
          if (!old) return;
          const now = rectIn(img, cardRect);
          if (!now.w || !now.h) return;
          const scale = Math.max(old.w / now.w, old.h / now.h);
          const clipX = Math.max(0, (now.w - old.w / scale) / 2);
          const clipY = Math.max(0, (now.h - old.h / scale) / 2);
          const dx = old.x + old.w / 2 - (now.x + now.w / 2);
          const dy = old.y + old.h / 2 - (now.y + now.h / 2);
          img.style.animation = "none"; // it's already here, so it doesn't fade in
          img.animate(
            [
              {
                transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
                clipPath: `inset(${clipY}px ${clipX}px)`,
              },
              { transform: "none", clipPath: "inset(0px 0px)" },
            ],
            MOVE,
          );
        });
    });

    if (prev.ghost && prev.ghostOf && prev.ghostOf !== anchor?.slug) {
      const home = cells.find((cell) => cell.dataset.cell === prev.ghostOf);
      const card = home?.firstElementChild as HTMLElement | undefined;
      if (card) {
        const ghost = prev.ghost;
        const travelling = new Set(
          [...(shownIn(card)?.querySelectorAll("img, video") ?? [])].map((img) => img.getAttribute("src")),
        );
        ghost.querySelectorAll<HTMLElement>("img, video").forEach((img) => {
          if (travelling.has(img.getAttribute("src"))) img.style.visibility = "hidden";
        });
        ghost.dataset.ghost = "";
        card.prepend(ghost);
        ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: "ease", fill: "forwards" }).onfinish =
          () => ghost.remove();
      }
    }
  }, [anchor, openExtra, fontsLoaded, rects, width]);

  // the web font can change how tall a title or the opened text is
  useEffect(() => {
    document.fonts?.ready.then(() => setFontsLoaded(true));
  }, []);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const measure = () => {
      setWidth(el.clientWidth);
      // below the desktop layout the page itself scrolls, and this box is as tall as its tiles
      setScreen(Math.min(el.clientHeight, window.innerHeight));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    if (!anchor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor]);

  return (
    <div className={s.scroll} ref={scroller}>
      <div
        ref={grid}
        className={s.grid}
        data-ready={width !== null}
        data-compact={compact}
        style={{ height, "--caption-h": `${caption}px` } as React.CSSProperties}
      >
          {projects.map((project) => {
            const isOpen = project.slug === anchor?.slug;
            const r = rects[project.slug];
            const rows = rowsOf(project);
            const more = project.images.length - rows.flat().length;
            return (
              <div
                key={project.slug}
                className={s.cell}
                data-cell={project.slug}
                data-open={isOpen}
                style={
                  {
                    left: r.x,
                    top: r.y,
                    width: r.w,
                    height: r.h,
                    "--cell-w": `${r.w - 1}px`,
                    "--cell-h": `${r.h - 1}px`,
                  } as React.CSSProperties
                }
              >
                <article className={s.card}>
                  <button
                    type="button"
                    className={s.face}
                    data-face
                    aria-label={`${project.title}, ${project.tags.join(" / ")}`}
                    aria-expanded={isOpen}
                    tabIndex={isOpen ? -1 : 0}
                    onClick={(e) => open(project.slug, e)}
                  >
                    <span className={s.frame}>
                      {rows.map((images, r) => (
                        <span key={r} className={s.tileRow}>
                          {images.map((image) => (
                            <Img key={image.src} image={image} alt={altFor(project, image)} />
                          ))}
                        </span>
                      ))}
                    </span>
                    <span className={s.caption} data-caption={project.slug}>
                      <span className={p.title}>{project.title}</span>
                      <span className={s.tagsAndMore} data-empty={more === 0}>
                        <span className={s.tags}>
                          <Tags tags={project.tags} />
                        </span>
                        {/* a phone's way to say there's more: a word at the end of the line */}
                        {more > 0 && <span className={s.moreText}>+{more}</span>}
                        <span className={s.more}>
                          {more > 0 && <span className={s.count}>+{more}</span>}
                          <Arrow className={s.arrow} />
                        </span>
                      </span>
                    </span>
                  </button>
                  {isOpen && shape && (
                    <Opened
                      project={project}
                      shape={shape}
                      width={r.w}
                      alone={r.w >= space - 1}
                      onClose={close}
                    />
                  )}
                </article>
              </div>
            );
          })}
      </div>
    </div>
  );
}
