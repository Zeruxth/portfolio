"use client";

import { useEffect, useRef } from "react";
import s from "./ScrollLine.module.css";

const MIN_HEIGHT = 24;
const LINGER_MS = 700;
const RECOLOUR_MS = 80;
const CELLS = 24;

type Thumb = { data: Uint8ClampedArray; w: number; h: number };

const thumbs = new Map<string, Thumb | null>();
let ctx: CanvasRenderingContext2D | null = null;

function shrink(source: CanvasImageSource, w: number, h: number): Thumb | null {
  if (!ctx) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = CELLS;
    ctx = canvas.getContext("2d", { willReadFrequently: true });
  }
  if (!ctx) return null;
  try {
    ctx.clearRect(0, 0, CELLS, CELLS);
    ctx.drawImage(source, 0, 0, CELLS, CELLS);
    return { data: ctx.getImageData(0, 0, CELLS, CELLS).data, w, h };
  } catch {
    return null;
  }
}

/** A css background isn't in the page as an element, so it loads once on the side. */
function backgroundThumb(url: string) {
  if (!thumbs.has(url)) {
    thumbs.set(url, null);
    const image = new Image();
    image.onload = () =>
      thumbs.set(url, shrink(image, image.naturalWidth, image.naturalHeight));
    image.src = url;
  }
  return thumbs.get(url) ?? null;
}

function luma(r: number, g: number, b: number) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Brightness of a thumb at a page point, reading it as object-fit: cover; null where it's see-through. */
function thumbLuma(thumb: Thumb, box: DOMRect, x: number, y: number) {
  const scale = Math.max(box.width / thumb.w, box.height / thumb.h);
  const u = (x - box.left - (box.width - thumb.w * scale) / 2) / (thumb.w * scale);
  const v = (y - box.top - (box.height - thumb.h * scale) / 2) / (thumb.h * scale);
  const col = Math.min(CELLS - 1, Math.max(0, Math.floor(u * CELLS)));
  const row = Math.min(CELLS - 1, Math.max(0, Math.floor(v * CELLS)));
  const i = (row * CELLS + col) * 4;
  const { data } = thumb;
  return data[i + 3] < 128 ? null : luma(data[i], data[i + 1], data[i + 2]);
}

/** Brightness of whatever shows at a point; the line itself isn't hit, having no pointer events. */
function lumaAt(x: number, y: number) {
  for (const el of document.elementsFromPoint(x, y)) {
    // another document's pixels can't be read
    if (el instanceof HTMLIFrameElement) return null;

    let thumb: Thumb | null = null;
    if (el instanceof HTMLImageElement) {
      if (el.complete && el.naturalWidth) {
        if (!thumbs.has(el.currentSrc)) {
          thumbs.set(el.currentSrc, shrink(el, el.naturalWidth, el.naturalHeight));
        }
        thumb = thumbs.get(el.currentSrc) ?? null;
      }
    } else if (el instanceof HTMLVideoElement) {
      if (el.readyState >= 2) thumb = shrink(el, el.videoWidth, el.videoHeight);
    }

    const style = getComputedStyle(el);
    const url = /url\("(.+?)"\)/.exec(style.backgroundImage)?.[1];
    if (!thumb && url) thumb = backgroundThumb(url);
    if (thumb) {
      const seen = thumbLuma(thumb, el.getBoundingClientRect(), x, y);
      if (seen !== null) return seen;
    }

    const rgba = style.backgroundColor.match(/[\d.]+/g)?.map(Number);
    if (rgba && (rgba[3] === undefined || rgba[3] > 0.5)) {
      return luma(rgba[0], rgba[1], rgba[2]);
    }
  }
  return null;
}

/**
 * Stands in for the hidden browser scrollbar. There is one line for the whole
 * site: it goes to whichever panel is scrolling, so a new panel needs no wiring.
 * It is always one flat colour, --ink or --bg, whichever reads against what's under it.
 */
export default function ScrollLine() {
  const line = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = line.current;
    if (!el) return;
    let hide = 0;
    let recolouring = 0;
    let x = 0;
    let y = 0;
    let height = 0;

    const recolour = () => {
      const seen = [0.1, 0.3, 0.5, 0.7, 0.9]
        .map((at) => lumaAt(x - 1, y + height * at))
        .filter((l) => l !== null);
      if (!seen.length) return;
      const mean = seen.reduce((sum, l) => sum + l, 0) / seen.length;
      // a dead band, so ground around the middle doesn't flip it back and forth
      if (mean < 0.45) el.dataset.over = "dark";
      else if (mean > 0.55) el.dataset.over = "light";
    };

    const onScroll = (e: Event) => {
      // scroll doesn't bubble, so this listens on the way down; the page itself reports as document
      const page = e.target === document;
      const box = page ? document.documentElement : (e.target as Element);
      const range = box.scrollHeight - box.clientHeight;
      if (range < 1) return;
      if (!page && !/auto|scroll/.test(getComputedStyle(box).overflowY)) return;

      const rect = page ? { left: 0, top: 0 } : box.getBoundingClientRect();
      const track = box.clientHeight;
      height = Math.max(MIN_HEIGHT, (track * track) / box.scrollHeight);
      // clamped because Safari's rubber band runs past both ends
      const at = Math.min(1, Math.max(0, box.scrollTop / range));
      // client edges, so it sits inside a panel's own right rule rather than on it
      x = rect.left + box.clientLeft + box.clientWidth - el.offsetWidth;
      y = rect.top + box.clientTop + at * (track - height);

      el.style.height = `${height}px`;
      el.style.transform = `translate(${x}px, ${y}px)`;

      // right away when it appears, then a few times a second while it moves
      if (el.dataset.on !== "true") {
        recolour();
      } else if (!recolouring) {
        recolouring = window.setTimeout(() => {
          recolouring = 0;
          recolour();
        }, RECOLOUR_MS);
      }

      el.dataset.on = "true";
      clearTimeout(hide);
      hide = window.setTimeout(() => {
        el.dataset.on = "false";
      }, LINGER_MS);
    };

    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      clearTimeout(hide);
      clearTimeout(recolouring);
    };
  }, []);

  return <div ref={line} className={s.line} data-on="false" data-over="light" aria-hidden="true" />;
}
