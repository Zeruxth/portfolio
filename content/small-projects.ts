/**
 * The smaller projects, in the order they appear: no inner pages, each one opens
 * where it sits in the grid. The first images are the tile. `w` and `h` are each
 * file's size, so a tile or an opened gallery knows its shape before it loads.
 *
 * Nothing is ever cropped: a tile takes its shape from its images. `rows` says how
 * many images sit on each row of the tile, so [2, 2] shows four, and any left over
 * are counted on the tile and seen when it opens.
 *
 * `open` composes the project once it's open, to show the images bigger. Each list is
 * a row, each number a column in it holding that many images stacked, so [[1, 2]] is
 * one large image beside two stacked. It always uses every image, in order.
 *
 * BANDS below arranges the tiles on the page.
 */

export interface SmallImage {
  /** the image, or the video's poster */
  src: string;
  w: number;
  h: number;
  /** a muted loop that plays instead of the image */
  video?: string;
}

export interface SmallProject {
  slug: string;
  title: string;
  /** rendered slash-joined, as on the Projects list */
  tags: string[];
  /** the text explaining it, shown once it's open */
  description: string;
  rows: number[];
  open: number[][];
  /** how much of the screen's height it aims for once open, if not all of it */
  openSize?: number;
  /** a piece of the description that links out */
  link?: { text: string; href: string };
  /** another site, linked once it's open */
  site?: { label: string; href: string };
  images: SmallImage[];
}

const images = (slug: string, sizes: [number, number][]): SmallImage[] =>
  sizes.map(([w, h], i) => ({ src: `/smaller-projects/${slug}/${i + 1}.jpg`, w, h }));

export const SMALL_PROJECTS: SmallProject[] = [
  {
    slug: "45-degrees",
    title: "45 Degrees",
    rows: [2, 1],
    open: [[1, 1], [1, 1]],
    tags: ["Information Design", "Poster Design"],
    description:
      "Haifa has some ridiculous hills. I used actual slope data to create a sarcastic series of maps, street signs, and warnings for a University of Haifa merchandise brief.",
    images: images("45-degrees", [[1552, 2194], [1456, 2062], [1768, 1174], [2000, 1413]]),
  },
  {
    slug: "playlists",
    title: "Playlists",
    rows: [2, 2],
    open: [[1, 1, 1], [1, 1, 1, 1]],
    tags: ["Cover Design", "Mixed Media"],
    description:
      "I spend enough time making playlists that I figured they deserved their own covers. Each one is an excuse to try something different, from illustration and typography to 3D.",
    images: images("playlists", [[1292, 1292], [1290, 1290], [1290, 1290], [1292, 1290], [1290, 1290], [1290, 1290], [1292, 1292]]),
  },
  {
    slug: "platypus-sparrow",
    title: "The Platypus & The Sparrow",
    rows: [3],
    open: [[1, 1], [1, 1, 1]],
    tags: ["Poster Design", "Collage"],
    description:
      "For a student project, we imagined a bar split in two: the loud and lively Sparrow upstairs, and the quieter Platypus downstairs. I designed a series of posters using cutouts, layered imagery, and rough textures.",
    images: images("platypus-sparrow", [[1258, 1798], [1258, 1800], [1258, 1800], [1258, 1796], [1258, 1800]]),
  },
  {
    slug: "beyond-the-uniform",
    title: "Beyond the Uniform",
    rows: [3],
    open: [[1, 2]],
    tags: ["Campaign Design", "AI Imagery"],
    description:
      "A small campaign to recruit participants for a PTSD study. I used AI-generated imagery to mix military gear with everyday objects, connecting the military and civilian sides of life in a familiar way.",
    images: images("beyond-the-uniform", [[1620, 2025], [1620, 2022], [1620, 2025]]),
  },
  {
    slug: "kalpi",
    title: "Kalpi",
    rows: [1],
    open: [[1]],
    tags: ["Interactive Web", "Illustration"],
    description:
      "A little interactive project I made around the idea that participation might grow into something. Every blank ballot turns into a flower, adding to a garden everyone shares.",
    site: { label: "Visit site", href: "https://yitzmach.site/" },
    images: [{ src: "/smaller-projects/kalpi/1.jpg", w: 864, h: 1152, video: "/smaller-projects/kalpi/loop.mp4" }],
  },
  {
    slug: "korea",
    title: "Korea",
    rows: [4, 4],
    open: [[1, 1], [1, 1, 1], [1, 1, 1]],
    tags: ["Photography"],
    description:
      "A few photos from my trip to Korea. Mostly street scenes, architecture, and little things that caught my eye while walking around.",
    images: images("korea", [[1198, 1800], [1198, 1800], [1198, 1800], [1350, 1800], [1350, 1800], [1350, 1800], [1350, 1800], [1093, 1459]]),
  },
  {
    slug: "daisy",
    title: "Daisy",
    rows: [1],
    open: [[1]],
    tags: ["Print Design", "Illustration"],
    description:
      "A punch card I designed for my sister-in-law's home bakery. I went with bright colors and playful food illustrations to make something a little more fun to bring back next time.",
    images: images("daisy", [[1350, 1800]]),
  },
  {
    slug: "haifa-plants",
    title: "Haifa Plants",
    rows: [2],
    open: [[1], [1]],
    tags: ["Illustration", "Merchandise Design"],
    description:
      "What if the University of Haifa logo grew into plants? I took shapes from the logo and turned them into a series of geometric potted plants as part of a merchandise brief.",
    images: [
      { src: "/smaller-projects/haifa-plants/1.png", w: 1800, h: 1384 },
      { src: "/smaller-projects/haifa-plants/2.jpg", w: 1800, h: 1200 },
    ],
  },
  {
    slug: "haifa-flowers",
    title: "Haifa Flowers",
    rows: [2],
    open: [[1, 1]],
    tags: ["Illustration", "Print Design"],
    description:
      "Another idea for the University of Haifa merchandise brief, this time using flowers found around Haifa. I illustrated them in bold colors and shapes for a poster and calendar.",
    images: images("haifa-flowers", [[592, 842], [417, 819]]),
  },
  {
    slug: "magnolia",
    title: "Magnolia",
    rows: [1],
    open: [[1]],
    tags: ["Poster Design", "Illustration"],
    description:
      "A poster I made for fun, combining a magnolia illustration with Hebrew typography and a few botanical details.",
    images: images("magnolia", [[1438, 1800]]),
  },
  {
    slug: "life-is-trash",
    title: "Life Is Trash",
    rows: [1],
    open: [[1]],
    tags: ["Poster Design", "Typography"],
    description:
      "Life can feel like trash sometimes, but that doesn't mean we can't do something about it. A little reminder to take matters into our own hands, made using a typeface by my friend @yonatanalperin123.",
    link: { text: "@yonatanalperin123", href: "https://www.instagram.com/yonatanalperin123/" },
    images: images("life-is-trash", [[1438, 1800]]),
  },
  {
    slug: "lunar-eclipse",
    title: "Lunar Eclipse",
    rows: [1],
    open: [[1]],
    tags: ["Poster Design", "Digital Illustration"],
    description:
      "A personal poster inspired by a lunar eclipse. I kept it pretty simple: a glowing moon, a few orbital lines, and plenty of grain.",
    images: images("lunar-eclipse", [[1438, 1800]]),
  },
  {
    slug: "montenegro",
    title: "Montenegro",
    rows: [3],
    open: [[1, 1, 1], [1, 1]],
    tags: ["Photography"],
    description:
      "Some photos from my trip to Montenegro. Mostly mountains, coastlines, old towns, and a surprising number of birds.",
    images: images("montenegro", [[1198, 1800], [1198, 1800], [1198, 1800], [1200, 1800], [1350, 1798]]),
  },
  {
    slug: "halloween-night",
    title: "Halloween Night",
    rows: [1],
    open: [[1]],
    tags: ["Motion Design", "Event Graphics"],
    description:
      "An animated poster I made for a friend's Halloween party. It moves between pumpkins, skulls, spiders, and other Halloween imagery, with bright iridescent colors against a dark background.",
    images: [{ src: "/smaller-projects/halloween-night/1.jpg", w: 864, h: 1080, video: "/smaller-projects/halloween-night/loop.mp4" }],
  },
  {
    slug: "rosh-hashana",
    title: "Rosh Hashana",
    rows: [1],
    open: [[1]],
    openSize: 0.65,
    tags: ["Motion Design", "Interactive Web"],
    description:
      "I made an animated Rosh Hashana greeting with a risograph-inspired look, then built a little website where anyone could create their own version.",
    site: { label: "Visit site", href: "https://aki12234-lgtm.github.io/Rosh_Hashana/" },
    images: [{ src: "/smaller-projects/rosh-hashana/1.jpg", w: 720, h: 1280, video: "/smaller-projects/rosh-hashana/loop.mp4" }],
  },
  {
    slug: "happy-hanukkah",
    title: "Happy Hanukkah",
    rows: [1],
    open: [[1]],
    tags: ["Postcard Design", "Illustration"],
    description:
      "A postcard I made for a Hanukkah exchange between students. Pixel-style illustrations, oversized typography, and a holiday greeting that isn't exactly traditional.",
    images: images("happy-hanukkah", [[1180, 1770]]),
  },
];

/**
 * The page, top to bottom. Each band fills the width and comes out flush, with sizes
 * worked out from the images, so nothing is cropped. A list nests: inside a band it's a
 * column of tiles stacked, each as tall as it needs, and a list inside that is a row
 * again. So heights differ from tile to tile and the rules don't line up across a band.
 */
export type BandItem = string | BandItem[];

export const BANDS: BandItem[][] = [
  [["kalpi", "haifa-plants"], ["playlists", "beyond-the-uniform"], "45-degrees"],
  ["halloween-night", ["montenegro", "platypus-sparrow"], "rosh-hashana"],
  [["korea", "haifa-flowers"], "happy-hanukkah", "lunar-eclipse"],
  ["daisy", "magnolia", "life-is-trash"],
];

/** the same, for windows wide enough to take more on each band rather than bigger tiles */
export const WIDE_BANDS: BandItem[][] = [
  [["kalpi", "haifa-plants"], ["playlists", "beyond-the-uniform"], "45-degrees", "happy-hanukkah"],
  ["halloween-night", ["montenegro", "platypus-sparrow"], "rosh-hashana", ["korea", "haifa-flowers"]],
  ["daisy", "magnolia", "life-is-trash", "lunar-eclipse"],
];

/** and for windows too narrow for three across */
export const NARROW_BANDS: BandItem[][] = [
  ["45-degrees", "kalpi"],
  ["halloween-night", ["playlists", "beyond-the-uniform"]],
  ["rosh-hashana", "haifa-flowers"],
  ["daisy", ["haifa-plants", "magnolia"]],
  ["korea", "life-is-trash"],
  ["montenegro", "platypus-sparrow"],
  ["lunar-eclipse", "happy-hanukkah"],
];
