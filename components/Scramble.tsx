"use client";

import { useEffect, useRef } from "react";
import { GROUNDS } from "@/lib/palette";

/*
 * The hero's SCRAMBLE TILES, run once as a sweep: the line's letters turn into
 * coloured tiles carrying a symbol, one after another from left to right; then
 * the tiles give way to the new line, again from left to right. Uses
 * kinetic.css's own .k-tile / .k-tg and the hero's symbol set.
 */

const SYMBOLS = "*&%^#@$!?/\\<>+=~".split("");
const STEP = 16; // ms between letters in each sweep
const FLICKER = 70; // ms between a live tile's symbol changes, the hero's tick

export default function Scramble({
  from,
  to,
  play,
  onDone,
}: {
  from: string;
  to: string;
  /** starts the sweep; the line shows `from` until then */
  play: boolean;
  /** called once `to` is fully in */
  onDone?: () => void;
}) {
  const el = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!play || !el.current) return;
    const host = el.current;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    const finish = () => { host.textContent = to; onDone?.(); };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    let bag: string[] = [];
    const deal = () => {
      if (!bag.length) bag = shuffled(GROUNDS);
      return bag.pop()!;
    };
    const tile = () => {
      const t = document.createElement("span");
      t.className = "k-tile";
      t.style.background = deal();
      t.style.width = `${(0.55 + Math.random() * 0.6).toFixed(2)}em`; // independent of what it replaces
      const g = document.createElement("span");
      g.className = "k-tg";
      g.style.fontSize = "1.3em";
      g.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      t.appendChild(g);
      return t;
    };
    // one span per letter; spaces stay text so the line still wraps
    const lay = (text: string) => {
      host.textContent = "";
      const letters: HTMLElement[] = [];
      for (const ch of text) {
        if (ch === " ") { host.appendChild(document.createTextNode(" ")); continue; }
        const s = document.createElement("span");
        s.textContent = ch;
        host.appendChild(s);
        letters.push(s);
      }
      return letters;
    };

    // live tiles keep changing symbol, as the hero's do
    const flicker = window.setInterval(() => {
      host.querySelectorAll<HTMLElement>(".k-tg").forEach((g) => {
        if (Math.random() < 0.5) g.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      });
    }, FLICKER);

    // 1. the old line goes to tiles, left to right
    const old = lay(from);
    old.forEach((s, i) => later(() => s.replaceWith(tile()), i * STEP));

    // 2. all tiles: lay the new line as tiles, then let each letter in, left to right
    const swap = old.length * STEP + 120;
    later(() => {
      const next = lay(to);
      const tiles = next.map((s) => { const t = tile(); s.replaceWith(t); return t; });
      tiles.forEach((t, i) => later(() => t.replaceWith(next[i]), i * STEP));
      later(() => { window.clearInterval(flicker); finish(); }, tiles.length * STEP + 40);
    }, swap);

    return () => { timers.forEach(clearTimeout); window.clearInterval(flicker); };
    // run once per play; from/to are fixed for a form
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play]);

  return <span ref={el}>{from}</span>;
}

function shuffled<T>(list: T[]): T[] {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
