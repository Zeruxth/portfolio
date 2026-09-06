/* Exported from Figma. The arrow is one path shared by the contact block and the
   hover rows — the Figma exports differ only in fill, so it takes currentColor. */

export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 30.3438 19.2109"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M29.5557 8.44629L30.3438 9.23926L29.5879 10.0625L21.1943 19.2109L19.4697 17.6289L25.6846 10.8545L17.2061 12.5244L16.8438 12.5957L16.5068 12.4463L9.62305 9.40234L0.769531 12.4814L0 10.2705L9.29004 7.04004L9.72559 6.88867L10.1475 7.0752L17.1162 10.1553L26.1816 8.37109L19.502 1.65039L21.1621 0L29.5557 8.44629Z" />
    </svg>
  );
}

export const LOGO_PATHS = [
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
