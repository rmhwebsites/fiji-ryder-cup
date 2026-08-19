/**
 * Matchplay engine. Pure functions, no I/O — everything here is derived from
 * the raw score and beer rows that come out of the database.
 *
 * Front 9 is best ball: each player posts a gross score, the team takes the
 * lower of the two. Back 9 is a scramble: the team posts one score.
 *
 * Each nine is a separate matchplay match worth 1 point, or half a point each
 * if it finishes level, so the cup is played for 20 points and 10-10 is a tie.
 *
 * Holes do not carry over. A halved hole is simply dead — it moves nobody, and
 * a nine where both sides win the same number of holes is halved.
 */

import {
  BEER_TARGET,
  SEGMENT_META,
  type Segment,
  segmentForHole,
} from "./course";
import { MATCHES, TEAM_IDS, type TeamId } from "./tournament";

/**
 * One stroke entry.
 *
 * `slot` is 1 or 2 on the front nine (which of the pairing's two players), and
 * 0 on the back nine, where the scramble produces a single team score.
 */
export interface ScoreRow {
  matchNo: number;
  hole: number;
  team: TeamId;
  slot: number;
  strokes: number;
}

/**
 * Beers one player logged on one hole.
 *
 * `slot` is 1 or 2, the same player positions the scores use. 0 is a legacy
 * team-level entry from before beers were tracked per player; it still counts
 * toward the pairing, it just belongs to nobody in particular.
 */
export interface BeerRow {
  matchNo: number;
  hole: number;
  team: TeamId;
  slot: number;
  beers: number;
}

/** All raw rows for a single match, indexed for fast lookup. */
export interface MatchState {
  /** `${team}:${hole}:${slot}` -> strokes */
  strokes: Map<string, number>;
  /** `${team}:${hole}:${slot}` -> beers */
  beers: Map<string, number>;
}

export const strokeKey = (team: TeamId, hole: number, slot: number) =>
  `${team}:${hole}:${slot}`;

export const beerKey = (team: TeamId, hole: number, slot: number) =>
  `${team}:${hole}:${slot}`;

export function emptyMatchState(): MatchState {
  return { strokes: new Map(), beers: new Map() };
}

/** Bucket flat database rows into per-match state. */
export function buildMatchStates(
  scores: ScoreRow[],
  beers: BeerRow[],
): Map<number, MatchState> {
  const states = new Map<number, MatchState>();
  for (const m of MATCHES) states.set(m.no, emptyMatchState());

  for (const row of scores) {
    const state = states.get(row.matchNo);
    if (!state) continue;
    state.strokes.set(strokeKey(row.team, row.hole, row.slot), row.strokes);
  }
  for (const row of beers) {
    const state = states.get(row.matchNo);
    if (!state) continue;
    state.beers.set(beerKey(row.team, row.hole, row.slot ?? 0), row.beers);
  }
  return states;
}

/** A player's gross score on a hole, or null if nothing entered yet. */
export function playerScore(
  state: MatchState,
  team: TeamId,
  hole: number,
  slot: number,
): number | null {
  return state.strokes.get(strokeKey(team, hole, slot)) ?? null;
}

/**
 * The team's score on a hole.
 *
 * Front nine: the lower of the pairing's two gross scores. If only one player
 * has an entry that entry stands, which is what you want when a partner picks
 * up — nobody has to key in a score that was never going to count.
 *
 * Back nine: the single scramble score.
 */
export function teamHoleScore(
  state: MatchState,
  team: TeamId,
  hole: number,
): number | null {
  if (segmentForHole(hole) === "back") {
    return playerScore(state, team, hole, 0);
  }
  const a = playerScore(state, team, hole, 1);
  const b = playerScore(state, team, hole, 2);
  if (a === null) return b;
  if (b === null) return a;
  return Math.min(a, b);
}

export type HoleResult = TeamId | "halve" | null;

/** Who won a hole. Null until both teams have a score on it. */
export function holeResult(state: MatchState, hole: number): HoleResult {
  const badgers = teamHoleScore(state, "badgers", hole);
  const gators = teamHoleScore(state, "gators", hole);
  if (badgers === null || gators === null) return null;
  if (badgers < gators) return "badgers";
  if (gators < badgers) return "gators";
  return "halve";
}

export interface SegmentStatus {
  segment: Segment;
  /** Team currently ahead, or null when all square. */
  leader: TeamId | null;
  /** How many holes that team is up. 0 when all square. */
  up: number;
  /** Holes completed in this nine. */
  thru: number;
  /** Holes still to play in this nine. */
  remaining: number;
  /** True once the match is mathematically decided or all nine are played. */
  finished: boolean;
  /** True when it ended early, e.g. 3&2. */
  closedOut: boolean;
  /** Whether a single score has been entered yet. */
  started: boolean;
  /** "3&2", "1 UP", "TIE" when done; "2 UP" or "TIE" while live. */
  result: string;
  /** Points earned so far — zeroes until the nine is finished. */
  points: Record<TeamId, number>;
}

/** Status of one nine of one match. */
export function segmentStatus(
  state: MatchState,
  segment: Segment,
): SegmentStatus {
  const holes = SEGMENT_META[segment].holes;

  let badgersUp = 0;
  let thru = 0;
  let started = false;
  let finished = false;
  let closedOut = false;
  let decidedAfter = holes.length;

  for (let i = 0; i < holes.length; i++) {
    const hole = holes[i];

    if (!started) {
      for (const team of TEAM_IDS) {
        if (teamHoleScore(state, team, hole) !== null) started = true;
      }
    }

    const result = holeResult(state, hole);
    if (result === null) break;

    thru = i + 1;
    if (result === "badgers") badgersUp += 1;
    else if (result === "gators") badgersUp -= 1;

    const remainingAfter = holes.length - thru;
    if (Math.abs(badgersUp) > remainingAfter) {
      finished = true;
      closedOut = remainingAfter > 0;
      decidedAfter = thru;
      break;
    }
  }

  if (thru === holes.length) finished = true;

  const remaining = finished ? 0 : holes.length - thru;
  const up = Math.abs(badgersUp);
  const leader = badgersUp > 0 ? "badgers" : badgersUp < 0 ? "gators" : null;

  const points: Record<TeamId, number> = { badgers: 0, gators: 0 };
  if (finished) {
    if (leader === null) {
      points.badgers = 0.5;
      points.gators = 0.5;
    } else {
      points[leader] = 1;
    }
  }

  let result: string;
  if (up === 0) {
    result = "TIE";
  } else if (finished && closedOut) {
    result = `${up}&${holes.length - decidedAfter}`;
  } else {
    result = `${up} UP`;
  }

  return {
    segment,
    leader,
    up,
    thru,
    remaining,
    finished,
    closedOut,
    started,
    result,
    points,
  };
}

export type BeerPace =
  | "sending"
  | "ahead"
  | "on-pace"
  | "behind"
  | "parched"
  | "idle";

export interface BeerStatus {
  /** Beers logged by this pairing so far. */
  total: number;
  /** Beers they should be on after this many holes — one per hole. */
  expected: number;
  /** total - expected. Positive is ahead. */
  diff: number;
  pace: BeerPace;
  label: string;
  /** How far through the 18-beer requirement they are, 0-1. */
  progress: number;
  /** Still owed to reach 18. */
  remaining: number;
}

const PACE_LABELS: Record<BeerPace, string> = {
  sending: "Sending it",
  ahead: "Ahead",
  "on-pace": "On pace",
  behind: "Behind",
  parched: "Parched",
  idle: "Not started",
};

/** Total beers a pairing has logged across every hole. */
export function teamBeers(state: MatchState, team: TeamId): number {
  let total = 0;
  for (const [key, count] of state.beers) {
    if (key.startsWith(`${team}:`)) total += count;
  }
  return total;
}

/** Beers a pairing logged on one hole — both players plus any legacy rows. */
export function holeBeers(
  state: MatchState,
  team: TeamId,
  hole: number,
): number {
  let total = 0;
  for (const slot of [0, 1, 2]) {
    total += state.beers.get(beerKey(team, hole, slot)) ?? 0;
  }
  return total;
}

/** Beers one player logged on one hole. */
export function playerHoleBeers(
  state: MatchState,
  team: TeamId,
  hole: number,
  slot: number,
): number {
  return state.beers.get(beerKey(team, hole, slot)) ?? 0;
}

/** One player's beers across the whole round. */
export function playerBeers(
  state: MatchState,
  team: TeamId,
  slot: number,
): number {
  let total = 0;
  for (let hole = 1; hole <= 18; hole++) {
    total += playerHoleBeers(state, team, hole, slot);
  }
  return total;
}

/**
 * Where a pairing sits against the one-beer-per-hole pace.
 *
 * `holesPlayed` is how far round they are (0-18), which sets the expectation.
 */
export function beerStatus(total: number, holesPlayed: number): BeerStatus {
  const expected = Math.min(Math.max(holesPlayed, 0), BEER_TARGET);
  const diff = total - expected;

  let pace: BeerPace;
  if (holesPlayed === 0 && total === 0) pace = "idle";
  else if (diff >= 3) pace = "sending";
  else if (diff >= 1) pace = "ahead";
  else if (diff >= -1) pace = "on-pace";
  else if (diff >= -3) pace = "behind";
  else pace = "parched";

  return {
    total,
    expected,
    diff,
    pace,
    label: PACE_LABELS[pace],
    progress: Math.min(total / BEER_TARGET, 1),
    remaining: Math.max(BEER_TARGET - total, 0),
  };
}

export interface MatchSummary {
  matchNo: number;
  /** Raw entries, so the score screen can read individual players. */
  raw: MatchState;
  front: SegmentStatus;
  back: SegmentStatus;
  /** Holes completed across all 18. */
  holesPlayed: number;
  /**
   * The hole the group is on: the first one still missing a result, or 18 once
   * the card is full. This is also what makes the score reset at the turn —
   * the moment hole 9 is in, this points at 10 and `current` becomes the back
   * nine, which starts all square.
   */
  currentHole: number;
  /** Which nine `currentHole` belongs to. */
  currentSegment: Segment;
  /** The nine being played right now — the score that should be on the board. */
  current: SegmentStatus;
  beers: Record<TeamId, BeerStatus>;
  points: Record<TeamId, number>;
  /** Any score entered at all. */
  started: boolean;
  /** Both nines done. */
  complete: boolean;
}

export function summarizeMatch(
  matchNo: number,
  state: MatchState,
): MatchSummary {
  const front = segmentStatus(state, "front");
  const back = segmentStatus(state, "back");

  // Holes played drives the beer pace, so count every hole that has a result
  // rather than stopping at a closed-out nine — the group keeps walking (and
  // drinking) even after a match is dead.
  let holesPlayed = 0;
  for (let hole = 1; hole <= 18; hole++) {
    if (holeResult(state, hole) !== null) holesPlayed += 1;
  }

  // The first hole nobody has posted yet. Falls through to 18 on a full card,
  // so a finished group reads as sitting on the last hole rather than jumping
  // to a 19th that does not exist.
  let currentHole = 18;
  for (let hole = 1; hole <= 18; hole++) {
    if (holeResult(state, hole) === null) {
      currentHole = hole;
      break;
    }
  }
  const currentSegment = segmentForHole(currentHole);

  const beers = {
    badgers: beerStatus(teamBeers(state, "badgers"), holesPlayed),
    gators: beerStatus(teamBeers(state, "gators"), holesPlayed),
  };

  return {
    matchNo,
    raw: state,
    front,
    back,
    holesPlayed,
    currentHole,
    currentSegment,
    current: currentSegment === "front" ? front : back,
    beers,
    points: {
      badgers: front.points.badgers + back.points.badgers,
      gators: front.points.gators + back.points.gators,
    },
    started: front.started || back.started,
    complete: front.finished && back.finished,
  };
}

export interface Standings {
  points: Record<TeamId, number>;
  beers: Record<TeamId, number>;
  matches: MatchSummary[];
  /** Nines finished out of 20. */
  segmentsComplete: number;
  /** Nines still live or untouched. */
  segmentsRemaining: number;
}

export function computeStandings(states: Map<number, MatchState>): Standings {
  const matches = MATCHES.map((m) =>
    summarizeMatch(m.no, states.get(m.no) ?? emptyMatchState()),
  );

  const points: Record<TeamId, number> = { badgers: 0, gators: 0 };
  const beers: Record<TeamId, number> = { badgers: 0, gators: 0 };
  let segmentsComplete = 0;

  for (const summary of matches) {
    for (const team of TEAM_IDS) {
      points[team] += summary.points[team];
      beers[team] += summary.beers[team].total;
    }
    if (summary.front.finished) segmentsComplete += 1;
    if (summary.back.finished) segmentsComplete += 1;
  }

  return {
    points,
    beers,
    matches,
    segmentsComplete,
    segmentsRemaining: MATCHES.length * 2 - segmentsComplete,
  };
}
