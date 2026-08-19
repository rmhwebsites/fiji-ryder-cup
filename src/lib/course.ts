/**
 * Course configuration — UGA Golf Course, Athens, GA.
 * Robert Trent Jones Sr., par 71.
 *
 * Par is taken from the course scorecard. Hole 18 is listed as 4/5 (the card
 * totals read 36/37 in and 71/72 total); we play it as a par 4 for par 71.
 *
 * Scoring is gross, so par never decides a hole, a match, or the cup. It sets
 * the number the stepper opens on and drives the birdie/eagle animations.
 */

export const COURSE = {
  name: "UGA Golf Course",
  city: "Athens, GA",
  par: 71,
} as const;

/** Par for holes 1-18, index 0 = hole 1. Out 35, in 36. */
export const HOLE_PARS: number[] = [
  4, 4, 3, 4, 4, 4, 5, 3, 4, // out — 35
  4, 4, 5, 3, 4, 4, 3, 5, 4, // in  — 36
];

export function parForHole(hole: number): number {
  return HOLE_PARS[hole - 1] ?? 4;
}

/** Holes 1-9 are played as best ball. */
export const FRONT_HOLES: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Holes 10-18 are played as a scramble. */
export const BACK_HOLES: number[] = [10, 11, 12, 13, 14, 15, 16, 17, 18];

export type Segment = "front" | "back";

export const SEGMENTS: Segment[] = ["front", "back"];

export const SEGMENT_META: Record<
  Segment,
  { label: string; format: string; short: string; holes: number[]; par: number }
> = {
  front: {
    label: "Front 9",
    format: "Best Ball",
    short: "F9",
    holes: FRONT_HOLES,
    par: 35,
  },
  back: {
    label: "Back 9",
    format: "Scramble",
    short: "B9",
    holes: BACK_HOLES,
    par: 36,
  },
};

export function segmentForHole(hole: number): Segment {
  return hole <= 9 ? "front" : "back";
}

/** Beers a pairing is expected to put away over the full 18 — one per hole. */
export const BEER_TARGET = 18;

export type ScoreName =
  | "albatross"
  | "eagle"
  | "birdie"
  | "par"
  | "bogey"
  | "double"
  | "other";

/** What a gross score is called relative to par. Drives the celebrations. */
export function scoreName(strokes: number, hole: number): ScoreName {
  const diff = strokes - parForHole(hole);
  if (strokes === 1) return "albatross"; // a hole-in-one always gets the big one
  if (diff <= -3) return "albatross";
  if (diff === -2) return "eagle";
  if (diff === -1) return "birdie";
  if (diff === 0) return "par";
  if (diff === 1) return "bogey";
  if (diff === 2) return "double";
  return "other";
}

export const SCORE_LABELS: Record<ScoreName, string> = {
  albatross: "ALBATROSS",
  eagle: "EAGLE",
  birdie: "BIRDIE",
  par: "PAR",
  bogey: "BOGEY",
  double: "DOUBLE",
  other: "",
};
