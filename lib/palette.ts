/**
 * Every ground a coloured block can take. Black is ink only — never a ground.
 *
 * Red, green, magenta and orange are the menu's own hover colours. Blue
 * extends the set for the kinetic type, which needs more than four to stay
 * lively across a hundred grid cells. Blue is the value About used before it
 * went green (Figma 2047:495); orange is from the same palette.
 *
 * Imported by both lib/kinetic.ts and lib/placeholder.ts so the animation and
 * the preview art cannot fall out of step.
 */
export const GROUNDS: string[] = [
  "#E83A3A", // red — Projects
  "#E35D31", // orange — Tools
  "#199329", // green — About
  "#3A42E8", // blue
  "#E83AD0", // magenta — Smaller projects
];

export const INK = "#222222";
