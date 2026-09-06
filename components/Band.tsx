"use client";

import { useEffect, useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";
import { LONGEST_WORD, MONO_ADVANCE, PREFIX, type Section } from "@/lib/sections";
import { placeholderStrip } from "@/lib/placeholder";
import s from "./Band.module.css";

/** the rule never gets shorter than this, which is what fixes the type size */
const RULE_MIN = 60;
const GAPS = 20; // two 10px gaps
/** the .word line box, as a share of the em */
const LINE = 0.72;
/** fallback cap ratio, used only until the face has been measured */
const CAP = 0.698;
/** the band gets this much of the panel before height, not width, caps the size */
const BAND_SHARE = 0.3;

const PREVIEWS: Record<string, string> = {
  projects: placeholderStrip(0, 6),
  about: placeholderStrip(3, 6),
  archive: placeholderStrip(1, 6),
};

export default function Band({
  section,
  open,
}: {
  section: Section;
  open: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const [fs, setFs] = useState<number | null>(null);
  // cap height and baseline offset in px; both depend on which face actually loaded,
  // and Trade Gothic and the fallback do not agree
  const [face, setFace] = useState({ cap: 0, baseline: 1 });

  // The type size is fixed across sections, so it is set by the LONGEST word.
  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const panel = el.parentElement;
      const byWidth =
        (el.clientWidth - GAPS - RULE_MIN) /
        (MONO_ADVANCE * (PREFIX.length + LONGEST_WORD));
      const byHeight = panel
        ? (panel.clientHeight * BAND_SHARE - 32) / LINE
        : Number.POSITIVE_INFINITY;
      setFs(Math.max(24, Math.min(byWidth, byHeight)));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = probe.current;
    if (!el || fs === null) return;

    const read = () => {
      const cs = getComputedStyle(el);
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return;
      ctx.font = `${fs}px ${cs.fontFamily}`;
      const m = ctx.measureText(PREFIX);
      const asc = m.fontBoundingBoxAscent;
      const desc = m.fontBoundingBoxDescent;
      const line = LINE * fs;
      // the word's margin box bottom is the band's content bottom, so this is
      // how far the baseline falls below it
      const baselineInBox = (line - (asc + desc)) / 2 + asc;
      setFace({
        cap: m.actualBoundingBoxAscent || CAP * fs,
        baseline: line - baselineInBox,
      });
    };

    read();
    void document.fonts?.ready.then(read);
  }, [fs]);

  // the word cross-fades while the rule animates its length
  const [shown, setShown] = useState(section.word);
  const [fade, setFade] = useState(false);
  useEffect(() => {
    if (shown === section.word) return;
    setFade(true);
    const t = setTimeout(() => {
      setShown(section.word);
      setFade(false);
    }, 110);
    return () => clearTimeout(t);
  }, [section.word, shown]);

  const size = fs ?? 200;
  const widthOf = (chars: number) => `${chars * MONO_ADVANCE * size}px`;

  return (
    <div
      ref={ref}
      className={s.band}
      data-ready={fs !== null}
      style={
        {
          "--band-fs": `${size}px`,
          "--band-cap": `${face.cap || CAP * size}px`,
          "--band-baseline": `${face.baseline}px`,
          "--preview": PREVIEWS[section.key] ?? "none",
        } as React.CSSProperties
      }
    >
      <span ref={probe} className={s.word} style={{ width: widthOf(PREFIX.length) }}>
        <span className={s.glyphs}>{PREFIX}</span>
      </span>

      <span className={s.rule} data-open={open} />

      <span className={s.word} style={{ width: widthOf(section.word.length) }}>
        <span className={s.glyphs} data-fade={fade}>
          {shown}
        </span>
      </span>
    </div>
  );
}
