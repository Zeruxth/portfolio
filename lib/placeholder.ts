/**
 * PLACEHOLDER ARTWORK. Stand-ins for real project stills, drawn as SVG data URIs
 * so nothing has to be fetched. Delete this module once real imagery lands.
 */

import { GROUNDS } from "./palette";

function mark(i: number): string {
  const ink = "#222222";
  switch (i % 6) {
    case 0:
      return `<circle cx="150" cy="150" r="94" fill="${ink}"/>`;
    case 1:
      return `<g fill="${ink}">${[-30, 90, 210]
        .map(
          (x) =>
            `<rect x="${x}" y="-120" width="52" height="560" transform="rotate(22 150 150)"/>`,
        )
        .join("")}</g>`;
    case 2:
      return `<g fill="${ink}"><rect x="34" y="34" width="106" height="106"/><rect x="160" y="160" width="106" height="106"/></g>`;
    case 3:
      return `<g fill="none" stroke="${ink}" stroke-width="16"><circle cx="150" cy="150" r="40"/><circle cx="150" cy="150" r="82"/><circle cx="150" cy="150" r="124"/></g>`;
    case 4:
      return `<g fill="${ink}">${[30, 94, 158, 222]
        .map((y) => `<rect y="${y}" width="300" height="26"/>`)
        .join("")}</g>`;
    default:
      return `<path d="M20 260 L150 30 L280 260 Z" fill="${ink}"/>`;
  }
}

function dataUri(inner: string, w: number, h: number): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
    inner +
    `</svg>`;
  // single quotes around the URI: double quotes would terminate a style attribute
  return `url('data:image/svg+xml,${encodeURIComponent(svg)}')`;
}

function panel(i: number): string {
  return `<rect width="300" height="300" fill="${GROUNDS[i % GROUNDS.length]}"/>${mark(i)}`;
}

/** one square tile */
export function placeholderTile(i: number): string {
  return dataUri(panel(i), 300, 300);
}

/** a horizontal strip, for the band's preview box */
export function placeholderStrip(offset = 0, count = 6): string {
  let inner = "";
  for (let k = 0; k < count; k++) {
    inner += `<g transform="translate(${k * 300},0)">${panel(offset + k)}</g>`;
  }
  return dataUri(inner, count * 300, 300);
}
