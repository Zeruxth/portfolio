"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import type { Media, MediaRow, Project } from "@/content/projects";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";
import { Arrow } from "./icons";
import s from "./CaseStudy.module.css";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// the title's rule and the first chapter's rule land on the same pixel once stacked
const overlap = (i: number) => (i === 0 ? 1 : 0);

/** plays only while on screen, so a long page doesn't decode every video at once */
function LoopVideo({ src, poster, style }: { src: string; poster?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }, { rootMargin: "200px 0px" });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      className={s.video}
      style={style}
      src={BASE + src}
      poster={poster && BASE + poster}
      preload="metadata"
      muted
      loop
      playsInline
    />
  );
}

function Tile({ media }: { media: Media }) {
  const style = { aspectRatio: String(media.ratio) };
  if (!media.src) {
    return (
      <div className={`${s.tile} ${s.placeholder}`} style={style}>
        <span>{media.label}</span>
      </div>
    );
  }
  if (media.kind === "video") {
    const f = media.frame;
    return (
      <div
        className={`${s.tile} ${s.videoTile}`}
        style={{ ...style, background: media.ground }}
        role="img"
        aria-label={media.label}
      >
        <LoopVideo
          src={media.src}
          poster={media.poster}
          style={
            f && {
              left: `${f.left}%`,
              top: `${f.top}%`,
              width: `${f.width}%`,
              height: `${f.height}%`,
            }
          }
        />
      </div>
    );
  }
  return <img className={s.tile} style={style} src={BASE + media.src} alt={media.label} />;
}

function Rows({ rows }: { rows: MediaRow[] }) {
  return rows.map((row, i) => (
    <div key={i} className={s.row}>
      {row.map((m, k) => (
        <Tile key={k} media={m} />
      ))}
    </div>
  ));
}

/**
 * The sidebar is a viewport-high column that never scrolls. Each block sits
 * level with the first row of its chapter and rides up with the page; when it
 * reaches the stack at the top it stops there. The next block slides up over
 * it and stops just under its heading, so the stack reads
 * title / THE BOOK / THE WEBSITE as you go. NEXT PROJECT sits at the very end.
 *
 * Positions are written straight to the DOM on scroll — no React render per frame.
 */
export default function CaseStudy({ project, next }: { project: Project; next: Project }) {
  const study = project.study!;
  const scroller = useRef<HTMLDivElement>(null);
  const side = useRef<HTMLElement>(null);
  const blocks = useRef<(HTMLElement | null)[]>([]);
  const anchors = useRef<(HTMLElement | null)[]>([]);
  // measured: where each block rests, its heading height and its full height
  const geo = useRef<{ rest: number[]; shut: number[]; open: number[] }>({
    rest: [], shut: [], open: [],
  });

  const place = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const { rest, shut, open } = geo.current;
    const top = el.scrollTop;
    let stack = 0;
    const ys: number[] = [];
    for (let i = 0; i < rest.length; i++) {
      ys[i] = Math.max(stack, rest[i] - top);
      stack += shut[i] - overlap(i);
    }
    for (let i = 0; i < rest.length; i++) {
      const b = blocks.current[i];
      if (!b) continue;
      const y = Math.round(ys[i]);
      b.style.transform = `translateY(${y}px)`;
      // the next block slides over this one; cut this one off at its top edge
      // so nothing peeks out underneath
      const room = i < rest.length - 1 ? Math.round(ys[i + 1]) - y : Infinity;
      const hidden = Math.max(0, Math.round(open[i]) - room);
      b.style.clipPath = hidden ? `inset(0 0 ${hidden}px 0)` : "";
      b.dataset.folded = String(hidden > 0);
    }
  }, []);

  const measure = useCallback(() => {
    const n = blocks.current.length;
    const rest: number[] = [];
    const shut: number[] = [];
    const open: number[] = [];
    for (let i = 0; i < n; i++) {
      const b = blocks.current[i];
      if (!b) continue;
      const head = b.querySelector<HTMLElement>("[data-head]")!;
      const body = b.querySelector<HTMLElement>("[data-body]")!;
      // fractional heights, so stacked rules land on the same pixel rather than one apart
      const content = body.firstElementChild!.firstElementChild!;
      const h = (el: Element) => el.getBoundingClientRect().height;
      const border = h(b) - h(head) - h(body);
      shut[i] = h(head) + border;
      open[i] = shut[i] + h(content);
      // level with the chapter's first row, but never on top of the block above
      const anchor = i === 0 ? 0 : anchors.current[i]?.offsetTop ?? 0;
      rest[i] = i === 0 ? 0 : Math.max(anchor, rest[i - 1] + open[i - 1]);
    }
    geo.current = { rest, shut, open };
    place();
  }, [place]);

  useIsomorphicLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    // the scroller for height, the sidebar for text reflow, the chapters for
    // where they land; the blocks themselves change height as they fold, so not them
    if (scroller.current) ro.observe(scroller.current);
    if (side.current) ro.observe(side.current);
    anchors.current.forEach((a) => a && ro.observe(a));
    // webfonts change the text heights after first paint
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(place);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [place]);

  // clicking a stacked heading takes you back to where that block rests
  const goTo = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    const { rest, shut } = geo.current;
    const stack = shut.slice(0, i).reduce((a, h, k) => a + h - overlap(k), 0);
    el.scrollTo({ top: Math.max(0, rest[i] - stack), behavior: "smooth" });
  };

  return (
    <div className={s.scroller} ref={scroller}>
      <div className={s.layout}>
        <aside className={s.side} ref={side}>
          <div className={s.stack}>
            <section
              className={`${s.block} ${s.intro}`}
              ref={(el) => { blocks.current[0] = el; }}
            >
              <div data-head className={s.introHead}>
                <Link href="/projects" className={s.back} aria-label="Back to Selected Projects">
                  <Arrow className={s.backArrow} />
                </Link>
                <h1 className={s.title} onClick={() => goTo(0)}>
                  {project.title}
                </h1>
              </div>
              <div data-body className={s.body}>
                <div className={s.bodyIn}>
                  <div className={s.introBody}>
                    <ul className={s.meta}>
                      <li>{project.disciplines.join("/")}</li>
                      <li>{project.year}</li>
                      {project.note && <li>{project.note}</li>}
                    </ul>
                    <p className={s.text}>{study.summary}</p>
                    {study.link && (
                      <a
                        className={s.link}
                        href={study.link.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {study.link.label}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {study.chapters.map((c, i) => (
              <section
                key={c.label}
                className={s.block}
                ref={(el) => { blocks.current[i + 1] = el; }}
              >
                <h2 data-head className={s.label} onClick={() => goTo(i + 1)}>
                  {c.label}
                </h2>
                <div data-body className={s.body}>
                  <div className={s.bodyIn}>
                    <p className={`${s.text} ${s.chapterText}`}>{c.text}</p>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className={s.foot}>
            <Link href={`/projects/${next.slug}`} className={s.next}>
              Next project
              <Arrow className={s.nextArrow} />
            </Link>
          </div>
        </aside>

        <div className={s.media}>
          <Rows rows={study.intro} />
          {study.chapters.map((c, i) => (
            <div
              key={c.label}
              className={s.chapter}
              ref={(el) => { anchors.current[i + 1] = el; }}
            >
              <Rows rows={c.rows} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
