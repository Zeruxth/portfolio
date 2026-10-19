"use client";

import { useEffect, useState } from "react";
import s from "./RiotProductCard.module.css";

/**
 * The Polyflora product UI card (Figma 2211:3717 → 2211:3554). At rest it is
 * only its header, FOOD PACKAGING / FOOD BAG, in the middle of the tile. On
 * hover it opens from its centre: the title retypes to FLEXIBLE BAG, the bag
 * photo unveils, then the specs and tags settle in. Leaving closes it the
 * other way. Touch screens open and close it with a tap.
 *
 * Everything is in the post's own 473 units (--k), so the card scales with
 * the tile.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const FROM = "FOOD BAG";
const TO = "FLEXIBLE BAG";

// the retype: back to the shared F, then forward to the new name
const common = (() => { let i = 0; while (FROM[i] === TO[i]) i++; return i; })();
const STEPS = [
  ...Array.from({ length: FROM.length - common + 1 }, (_, i) => FROM.slice(0, FROM.length - i)),
  ...Array.from({ length: TO.length - common }, (_, i) => TO.slice(0, common + i + 1)),
];

export default function RiotProductCard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // walk the title one letter at a time towards whichever end the card is heading
  useEffect(() => {
    const target = open ? STEPS.length - 1 : 0;
    if (step === target) return;
    const t = setTimeout(() => setStep((i) => i + (target > i ? 1 : -1)), open ? 42 : 26);
    return () => clearTimeout(t);
  }, [open, step]);

  return (
    <div
      className={`${s.tile} ${open ? s.open : ""}`}
      onPointerEnter={(e) => { if (e.pointerType === "mouse") setOpen(true); }}
      onPointerLeave={(e) => { if (e.pointerType === "mouse") setOpen(false); }}
      onClick={(e) => { if ((e.nativeEvent as PointerEvent).pointerType !== "mouse") setOpen((o) => !o); }}
      role="img"
      aria-label="Polyflora product card: food packaging, flexible bag"
    >
      <div className={s.card}>
        <div className={s.frame}>
          <div className={s.head}>
            <div className={s.name}>
              <p className={s.kind}>FOOD PACKAGING</p>
              <p className={s.title}>{STEPS[step]}</p>
            </div>
            <div className={s.side}>
              <svg className={s.mark} viewBox="0 0 21.0405 19.7285" fill="none" aria-hidden="true">
                <rect x="0.119305" y="0.119305" width="20.8018" height="19.4899" rx="2.07524" stroke="#02390E" strokeWidth="0.23861" />
                <path d="M3.9133 9.16863H5.19162C5.46365 9.1383 6.40916 8.97623 7.0452 8.40255C7.66474 7.84374 7.55011 6.69484 7.54605 6.1874C7.5459 6.16953 7.54569 6.15463 7.54552 6.14419C7.53178 5.76534 7.55946 5.15645 7.82202 4.47353C7.99336 4.02786 8.21369 3.68343 8.39896 3.43969L12.2389 6.3539C13.6477 7.42302 14.1949 9.20527 13.7611 10.8137C13.7616 10.8133 13.7621 10.8129 13.7625 10.8124C13.6969 11.1845 13.6848 11.4468 13.9402 11.7384C14.2807 12.1273 14.8959 12.2876 15.2349 12.3477H17.1271C17.3887 12.3477 17.6008 12.5598 17.6008 12.8213V15.8152C17.6008 16.0768 17.3887 16.2888 17.1271 16.2888H14.1333C13.8717 16.2888 13.6597 16.0768 13.6597 15.8152V13.3625C13.6106 13.0303 13.4606 12.616 13.0489 12.2638C10.958 10.6977 9.45855 9.56801 9.06745 9.23642C9.01844 9.19487 8.87894 9.07395 8.67606 9.05164C8.48613 9.03076 8.2449 9.11588 7.87957 9.43719C7.57469 9.70534 7.44464 10.0453 7.39421 10.3528V12.6495C7.39421 12.9111 7.18217 13.1232 6.9206 13.1232H3.9133C3.65173 13.1232 3.43969 12.9111 3.43969 12.6495V9.64225C3.43969 9.38068 3.65173 9.16863 3.9133 9.16863Z" fill="#02390E" />
              </svg>
              <div className={s.go}>
                <svg className={s.arrow} viewBox="0 0 14.6948 12.2407" fill="none" aria-hidden="true">
                  <path d="M0.612034 6.11755H14.0768" strokeWidth="1.22407" strokeLinecap="round" strokeLinejoin="round" stroke="#498643" />
                  <path d="M8.57445 0.612034L14.0828 6.12034L8.57445 11.6287" strokeWidth="1.22407" strokeLinecap="round" strokeLinejoin="round" stroke="#498643" />
                </svg>
              </div>
            </div>
          </div>

          {/* the opening part: a grid row that grows from 0fr to 1fr */}
          <div className={s.more}>
            <div className={s.moreInner}>
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
    </div>
  );
}
