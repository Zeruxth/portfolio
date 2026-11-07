/* The arrow takes currentColor, so the contact block and the hover rows share it. */

/**
 * The arrow: a straight shaft and a 45-degree head, stroked, with a mitred tip.
 *
 * 1.886 is the logo's on-screen weight (1.43085 authored, drawn 1.3179x its
 * viewBox). Every arrow is rendered 1:1 with its 22 x 16 viewBox (--arrow-w and
 * --arrow-h in globals.css), so the authored number IS the on-screen number.
 * Change the logo's display size and this needs revisiting.
 *
 * Hover moves the <g>: the svg clips to its own box, so the arrow can slide out
 * of one side and back in the other wherever it sits.
 */
export const ARROW_STROKE = 1.886;

export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 22 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth={ARROW_STROKE}
        strokeLinecap="butt"
        strokeLinejoin="miter"
      >
        <path d="M0 8H20" />
        <path d="M13.37 15.3L20.67 8L13.37 0.7" />
      </g>
    </svg>
  );
}

/**
 * Sound on / off, drawn in the arrow's hand: the same stroke, butt ends and
 * mitred corners, on its own 30.344 x 19.211 box, larger than the arrow. The
 * speaker is a hard outline; "on" is two chevrons; "off" crosses them out. Every stroke has pathLength 1, so one draw-on
 * animation drives them all.
 */
export function Sound({ on, className }: { on: boolean; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 30.3438 19.2109"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth={ARROW_STROKE} strokeLinecap="butt" strokeLinejoin="miter">
        <path pathLength={1} d="M0.943 6.62H5.62L11.62 1.56V17.65L5.62 12.59H0.943Z" />
        {on ? (
          <g data-mark>
            <path pathLength={1} d="M15.43 5.06L19.72 9.25L15.43 13.84" />
            <path pathLength={1} d="M20.332 18.4199L29.5718 9.2544L20.332 0.8252" />
          </g>
        ) : (
          <g data-mark>
            <path pathLength={1} d="M17.06 4.78L27.06 14.43" />
            <path pathLength={1} d="M27.06 4.78L17.06 14.43" />
          </g>
        )}
      </g>
    </svg>
  );
}

/**
 * LinkedIn, Instagram and email as they really look, not redrawn: the first two
 * from Simple Icons, the envelope from Material Icons, one colour. Each viewBox is
 * tight to its drawing, so setting one height makes them all the same height.
 */
function Glyph({ d, viewBox = "0 0 24 24", className }: { d: string; viewBox?: string; className?: string }) {
  return (
    <svg
      className={className}
      viewBox={viewBox}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export function LinkedIn({ className }: { className?: string }) {
  return (
    <Glyph
      className={className}
      d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
    />
  );
}

export function Instagram({ className }: { className?: string }) {
  return (
    <Glyph
      className={className}
      d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"
    />
  );
}

export function Spotify({ className }: { className?: string }) {
  return (
    <Glyph
      className={className}
      d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
    />
  );
}

export function Mail({ className }: { className?: string }) {
  return (
    <Glyph
      className={className}
      viewBox="2 4 20 16"
      d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"
    />
  );
}

const LOGO_PATHS = [
  "M15.2354 27.3783L8.05012 24.897L4.89687 22.1056L3.50116 14.145L4.98075 10.9464L5.79145 9.1939L7.01627 6.54613L8.75867 5.19849L10.9406 3.51087L13.6329 1.42854H23.8164L26.1535 3.52746L28.5702 5.69789L31.9322 8.71722L32.0161 9.02009L32.5636 10.9958L34.31 17.2982L31.1051 23.7081L28.8532 24.627L22.1105 27.3783H15.2354Z",
  "M23.1444 7.42489L25.2638 6.59781L27.3832 7.42489",
  "M13.5295 7.26982L11.3067 6.90797L9.75594 8.45876",
  "M25.9875 3.65133L26.1535 3.52746M32.5636 10.9958L32.294 11.0951",
  "M10.9966 3.54796L10.9407 3.51088M4.98076 10.9465L5.20704 10.9917",
  "M28.4687 5.77072L28.5702 5.69787",
  "M5.79146 9.1939L5.85351 9.25104",
  "M7.09871 14.8448L9.08403 19.6117L14.7185 18.4872L16.1659 13.7314L13.633 10.1129L9.08403 10.7849L7.09871 14.8448Z",
  "M21.5419 12.4391V17.1432L26.0391 20.9167L30.4847 18.2804L29.761 12.4391L25.1604 10.1129L21.5419 12.4391Z",
  "M16.4243 18.4871L17.9234 16.9881H19.7843L20.6114 18.4871L19.4225 20.0379H17.9234L16.4243 18.4871Z",
  "M17.9234 16.9881L16.4243 18.4871L17.9234 20.0379H19.4225L20.6114 18.4871L19.7843 16.9881H17.9234Z",
  "M28.5702 5.69789L30.4848 4.32334L33.2245 5.3572V7.4766L32.0161 9.0201",
  "M7.32654 4.53008L4.43174 5.25378V7.9418L5.79156 9.19387L4.98086 10.9464L3.13942 10.5781L0.761559 7.42487L1.58864 3.03099L6.8613 0.808203L10.9408 3.51084L8.75878 5.19846L7.32654 4.53008Z",
  "M7.0163 6.54616L5.79148 9.19393L4.43166 7.94186V5.25384L7.32646 4.53014L8.7587 5.19852L7.0163 6.54616Z",
  "M30.4848 4.32334L33.2245 5.3572V7.4766L32.0161 9.0201L31.9322 8.71723L28.5702 5.69789L30.4848 4.32334Z",
  "M28.5701 5.69792L26.1534 3.52749L29.4508 1.06673L34.31 1.73873L36.5328 6.02923L35.2404 10.0096L32.5635 10.9958L32.016 9.02012L33.2244 7.47663V5.35723L30.4847 4.32337L28.5701 5.69792Z",
  "M23.8257 16.4449L24.1035 13.2511H26.7418L28.1304 15.2877L26.2326 17.1855L23.8257 16.4449Z",
  "M21.542 17.1432V12.4391L25.1605 10.1129L29.7611 12.4391L30.4848 18.2804L26.0393 20.9167L21.542 17.1432ZM23.8259 16.4449L24.1036 13.2511H26.7419L28.1305 15.2877L26.2328 17.1854L23.8259 16.4449Z",
  "M9.43881 15.1764L10.7524 12.9355L12.1047 12.5105L13.7274 13.8627L13.1865 16.2582L9.82517 17.1854L9.43881 15.1764Z",
  "M9.08403 19.6117L7.09871 14.8448L9.08403 10.7849L13.633 10.1129L16.1659 13.7314L14.7185 18.4872L9.08403 19.6117ZM9.43882 15.1764L10.7524 12.9355L12.1047 12.5105L13.7274 13.8628L13.1865 16.2582L9.82518 17.1854L9.43882 15.1764Z",
  "M22.3691 20.9167L20.9734 22.1056H18.936L18.526 20.6779L17.5403 22.1056H15.2355L14.6152 20.9167",
];

/**
 * Indices into LOGO_PATHS, grouped so each part can move independently.
 * 17 and 19 are compound duplicates of the eye patches (7, 8) plus the pupils
 * (16, 18) — rendering them double-strokes the eyes and breaks the blink,
 * since only one copy of each pupil would scale.
 */
export const LOGO_GROUPS: { name: string; paths: number[] }[] = [
  { name: "head", paths: [0] },
  { name: "earRight", paths: [11, 14, 15] },
  { name: "earLeft", paths: [12, 13] },
  { name: "eyes", paths: [7, 8] },
  { name: "pupilLeft", paths: [18] },
  { name: "pupilRight", paths: [16] },
  { name: "nose", paths: [9, 10] },
  { name: "mouth", paths: [20] },
  { name: "marks", paths: [1, 2, 3, 4, 5, 6] },
];

export function Logo({
  className,
  ref,
}: {
  className?: string;
  ref?: React.Ref<SVGSVGElement>;
}) {
  return (
    <svg
      ref={ref}
      className={className}
      viewBox="0 0 37.3056 28.0937"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Aki Yamin"
    >
      {LOGO_GROUPS.map((g) => (
        <g key={g.name} data-part={g.name}>
          {g.paths.map((i) => (
            <path
              key={i}
              d={LOGO_PATHS[i]}
              fillRule="evenodd"
              clipRule="evenodd"
              stroke="currentColor"
              strokeWidth="1.43085"
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

/** The tab's folded corner. The open edge is completed by the panel's top border. */
export function TabCut({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 280.82 50.8841"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M280.5 50.5L220.5 0.5H0.5V50.5" fill="none" stroke="currentColor" />
    </svg>
  );
}

/** the x on a tab, and on anything else that closes */
export function Close() {
  return (
    <svg viewBox="0 0 10.7033 10.7033" fill="none" aria-hidden="true">
      <path d="M10 0.7L0.7 10" strokeWidth={ARROW_STROKE} />
      <path d="M0.7 0.7L10 10" strokeWidth={ARROW_STROKE} />
    </svg>
  );
}
