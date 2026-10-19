"use client";

import { useEffect, useRef, useState } from "react";
import s from "./RiotProductCard.module.css";

/**
 * The Polyflora product UI card (Figma 2211:3717 → 2211:3554). At rest it is
 * only its header, FOOD PACKAGING / FOOD BAG, in the middle of the tile. On
 * hover it opens from its centre: the bag photo unveils, then the specs and
 * tags settle in. Leaving closes it the
 * other way.
 *
 * It plays on its own, like a video: a neon square cursor (the one in the
 * site recording) does the hover on a loop while the tile is on screen: in
 * from outside, onto the card, hold, out again. A real mouse doesn't touch it.
 * With reduced motion the card simply shows open.
 *
 * Everything is in the post's own 473 units (--k), so the card scales with
 * the tile.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
// the demo's path, in the post's 473 units: [seconds, x, y]; the card opens on arrival, closes on leaving
const PATH: [number, number, number][] = [
  [0, 520, 400], [0.6, 520, 400], [1.9, 262, 248], [5.2, 262, 248], [6.5, 520, 330], [8.3, 520, 330],
];
const OPEN_AT = 1.75, CLOSE_AT = 5.75, LOOP = 8.3;
const easeInOut = (k: number) => (k < 0.5 ? 16 * k ** 5 : 1 - (-2 * k + 2) ** 5 / 2);

function along(t: number): [number, number] {
  for (let i = 1; i < PATH.length; i++) {
    const [t1, x1, y1] = PATH[i], [t0, x0, y0] = PATH[i - 1];
    if (t <= t1) { const k = easeInOut((t - t0) / (t1 - t0)); return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k]; }
  }
  return [PATH[PATH.length - 1][1], PATH[PATH.length - 1][2]];
}

export default function RiotProductCard() {
  const [open, setOpen] = useState(false);
  const tile = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLSpanElement>(null);

  // The card is always laid out open; closed, it is clipped to its header and
  // slid so the header sits in the middle. --cut is how much hides below it.
  // (Only clip-path and translate move, so the browser never re-lays it out.)
  useEffect(() => {
    const el = tile.current, c = card.current, h = head.current;
    if (!el || !c || !h) return;
    const measure = () => {
      const k = el.clientWidth / 473;
      const cut = c.offsetHeight - h.offsetHeight - k * 2 * 7.607;
      c.style.setProperty("--cut", `${cut}px`);
    };
    measure();
    // only animate once the closed size is known, so the card doesn't fold shut on load
    requestAnimationFrame(() => requestAnimationFrame(() => c.setAttribute("data-ready", "")));
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(h);
    return () => ro.disconnect();
  }, []);

  // the demo cursor: runs while the tile is on screen and nobody is using it
  useEffect(() => {
    const el = tile.current, c = cursor.current;
    if (!el || !c) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setOpen(true); return; }
    let raf = 0, start = 0, visible = false, last = false;
    const frame = (now: number) => {
      if (!start) start = now;
      const t = ((now - start) / 1000) % LOOP;
      const [x, y] = along(t);
      c.style.opacity = "1";
      c.style.translate = `calc(var(--k) * ${x.toFixed(2)}) calc(var(--k) * ${y.toFixed(2)})`;
      const want = t >= OPEN_AT && t < CLOSE_AT;
      if (want !== last) { last = want; setOpen(want); }
      if (visible) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) { start = 0; raf = requestAnimationFrame(frame); }
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div
      ref={tile}
      className={`${s.tile} ${open ? s.open : ""}`}
      role="img"
      aria-label="Polyflora product card: food packaging, food bag"
    >
      <div ref={card} className={s.card}>
        <div className={s.frame}>
          <span className={s.outline} aria-hidden="true" />
          <div ref={head} className={s.head}>
            <div className={s.name}>
              <p className={s.kind}>FOOD PACKAGING</p>
              <p className={s.title}>FOOD BAG</p>
            </div>
            <div className={s.side}>
              <div className={s.markBox}>
              <svg className={s.mark} viewBox="3.44 3.44 14.161 12.849" fill="none" aria-hidden="true">
                <path d="M3.9133 9.16863H5.19162C5.46365 9.1383 6.40916 8.97623 7.0452 8.40255C7.66474 7.84374 7.55011 6.69484 7.54605 6.1874C7.5459 6.16953 7.54569 6.15463 7.54552 6.14419C7.53178 5.76534 7.55946 5.15645 7.82202 4.47353C7.99336 4.02786 8.21369 3.68343 8.39896 3.43969L12.2389 6.3539C13.6477 7.42302 14.1949 9.20527 13.7611 10.8137C13.7616 10.8133 13.7621 10.8129 13.7625 10.8124C13.6969 11.1845 13.6848 11.4468 13.9402 11.7384C14.2807 12.1273 14.8959 12.2876 15.2349 12.3477H17.1271C17.3887 12.3477 17.6008 12.5598 17.6008 12.8213V15.8152C17.6008 16.0768 17.3887 16.2888 17.1271 16.2888H14.1333C13.8717 16.2888 13.6597 16.0768 13.6597 15.8152V13.3625C13.6106 13.0303 13.4606 12.616 13.0489 12.2638C10.958 10.6977 9.45855 9.56801 9.06745 9.23642C9.01844 9.19487 8.87894 9.07395 8.67606 9.05164C8.48613 9.03076 8.2449 9.11588 7.87957 9.43719C7.57469 9.70534 7.44464 10.0453 7.39421 10.3528V12.6495C7.39421 12.9111 7.18217 13.1232 6.9206 13.1232H3.9133C3.65173 13.1232 3.43969 12.9111 3.43969 12.6495V9.64225C3.43969 9.38068 3.65173 9.16863 3.9133 9.16863Z" fill="#02390E" />
              </svg>
              </div>
              <div className={s.go}>
                <svg className={s.arrow} viewBox="0 0 14.6948 12.2407" fill="none" aria-hidden="true">
                  <path d="M0.612034 6.11755H14.0768" strokeWidth="1.22407" strokeLinecap="round" strokeLinejoin="round" stroke="#498643" />
                  <path d="M8.57445 0.612034L14.0828 6.12034L8.57445 11.6287" strokeWidth="1.22407" strokeLinecap="round" strokeLinejoin="round" stroke="#498643" />
                </svg>
              </div>
            </div>
          </div>

          {/* the opening part, revealed by the card's clip */}
          <div className={s.more}>
            <div>
              <div className={s.photo}>
                <img src={`${BASE}/blooming-riot/img/product-bag.jpg`} alt="" />
              </div>
              <div className={s.specs}>
                <div className={`${s.spec} ${s.specFirst}`}>
                  <p className={s.label}>SEALED STABILITY</p>
                  <p className={s.value}>12 MONTHS</p>
                </div>
                <div className={`${s.spec} ${s.specWide}`}>
                  <p className={s.label}>FUNCTIONAL WINDOW</p>
                  <p className={s.value}>72-168H AFTER OPENING</p>
                </div>
              </div>
              <div className={s.foot}>
                <div className={s.tags}>
                  <span>0.4 MM</span>
                  <span>PF-01</span>
                  <span>FLEXIBLE SHEET</span>
                </div>
                <p className={s.note}>[DRY FOOD / DIRECT CONTACT ONLY]</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <span ref={cursor} className={s.cursor} aria-hidden="true" />
    </div>
  );
}
