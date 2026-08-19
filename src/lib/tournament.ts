/**
 * FIJI RYDER CUP — tournament definition.
 *
 * Format: 10 matches, 40 players, two teams.
 *   Holes 1-9   — Best Ball  (each player plays their own ball, team takes the lower score)
 *   Holes 10-18 — Scramble   (team plays one ball, one score)
 *
 * Each nine is its own matchplay match worth 1 point, so 20 points are on the
 * table and 10.5 wins the cup.
 *
 * Scoring is straight gross. Handicaps are carried here for the roster page only
 * and never touch a score.
 */

export type TeamId = "badgers" | "gators";

export interface Team {
  id: TeamId;
  name: string;
  shortName: string;
  abbr: string;
}

export const TEAMS: Record<TeamId, Team> = {
  badgers: {
    id: "badgers",
    name: "Honey Badgers",
    shortName: "Badgers",
    abbr: "HB",
  },
  gators: {
    id: "gators",
    name: "Gators",
    shortName: "Gators",
    abbr: "GA",
  },
};

export const TEAM_IDS: TeamId[] = ["badgers", "gators"];

export interface Player {
  name: string;
  handicap: number;
}

export interface Match {
  /** 1-10, and the primary key used everywhere including the database. */
  no: number;
  /** Absolute instant, not a wall-clock string, so "has this group teed off"
   *  is answerable and the label is formatted in course time wherever you are. */
  teeAt: string;
  badgers: [Player, Player];
  gators: [Player, Player];
}

export const MATCHES: Match[] = [
  {
    no: 1,
    teeAt: "2026-08-20T14:00:00-04:00",
    badgers: [
      { name: "Chris Tanagho", handicap: 22 },
      { name: "Henry Grimsley", handicap: 9 },
    ],
    gators: [
      { name: "Hank Joiner", handicap: 9 },
      { name: "Lohan Heyns", handicap: 16 },
    ],
  },
  {
    no: 2,
    teeAt: "2026-08-20T14:12:00-04:00",
    badgers: [
      { name: "Steele Alkhas", handicap: 11 },
      { name: "Josh Brannan", handicap: 14 },
    ],
    gators: [
      { name: "Zan Heick", handicap: 15 },
      { name: "Ryan Huffman", handicap: 17 },
    ],
  },
  {
    no: 3,
    teeAt: "2026-08-20T14:24:00-04:00",
    badgers: [
      { name: "Charlie Sutton", handicap: 16 },
      { name: "Kiran Proctor", handicap: 3 },
    ],
    gators: [
      { name: "Will Jamieson", handicap: 14 },
      { name: "Park Howell", handicap: 3 },
    ],
  },
  {
    no: 4,
    teeAt: "2026-08-20T14:36:00-04:00",
    badgers: [
      { name: "Grady Bryan", handicap: 14 },
      { name: "Patrick Bryan", handicap: 10 },
    ],
    gators: [
      { name: "Brock Liolios", handicap: 13 },
      { name: "Andrew Elko", handicap: 17 },
    ],
  },
  {
    no: 5,
    teeAt: "2026-08-20T14:48:00-04:00",
    badgers: [
      { name: "Jack Voci", handicap: 16 },
      { name: "Elijah Pay", handicap: 19 },
    ],
    gators: [
      { name: "Tucker Robbins", handicap: 18 },
      { name: "James Levien", handicap: 16 },
    ],
  },
  {
    no: 6,
    teeAt: "2026-08-20T15:00:00-04:00",
    badgers: [
      { name: "Becker Curry", handicap: 10 },
      { name: "Clay Meredith", handicap: 16 },
    ],
    gators: [
      { name: "Wade Tolbert", handicap: 13 },
      { name: "Ryder Hilding", handicap: 14 },
    ],
  },
  {
    no: 7,
    teeAt: "2026-08-20T15:12:00-04:00",
    badgers: [
      { name: "Quinn Lyons", handicap: 9 },
      { name: "Ethan Hiers", handicap: 12 },
    ],
    gators: [
      { name: "Jack Fishpaw", handicap: 5 },
      { name: "Trey Hill", handicap: 10 },
    ],
  },
  {
    no: 8,
    teeAt: "2026-08-20T15:24:00-04:00",
    badgers: [
      { name: "Blake Stern", handicap: 14 },
      { name: "Ethan Golan", handicap: 17 },
    ],
    gators: [
      { name: "Benny Evans", handicap: 13 },
      { name: "Ryan Chain", handicap: 19 },
    ],
  },
  {
    no: 9,
    teeAt: "2026-08-20T15:36:00-04:00",
    badgers: [
      { name: "Campbell Gosslee", handicap: 1 },
      { name: "Brooks Longgrear", handicap: 7 },
    ],
    gators: [
      { name: "Will Strong", handicap: 3 },
      { name: "Carson Griffey", handicap: 10 },
    ],
  },
  {
    no: 10,
    teeAt: "2026-08-20T15:48:00-04:00",
    badgers: [
      { name: "Cole Dewey", handicap: 3 },
      { name: "Canon Brooks", handicap: 9 },
    ],
    gators: [
      { name: "Preston Hidy", handicap: -1 },
      { name: "Nick Pope", handicap: 8 },
    ],
  },
];

export function getMatch(no: number): Match | undefined {
  return MATCHES.find((m) => m.no === no);
}

/** Total points available: 10 matches x 2 nines. */
export const TOTAL_POINTS = MATCHES.length * 2;

/** Points needed to win the cup outright. Level at 10-10 is a tie. */
export const POINTS_TO_WIN = TOTAL_POINTS / 2 + 0.5;

/* ── When ──────────────────────────────────────────────────────────────── */

/**
 * The round is Thursday 20 August 2026 at the UGA Golf Course, first tee 2:00 PM.
 *
 * Times are stored as absolute instants at -04:00. August sits inside daylight
 * saving, so Eastern that day is EDT — writing -05:00 for "EST" would drag every
 * tee time an hour earlier than the sheet says.
 */
export const FIRST_TEE = MATCHES[0].teeAt;
export const LAST_TEE = MATCHES[MATCHES.length - 1].teeAt;

/** Course time, so a phone that never left Pacific still reads the tee sheet. */
export const COURSE_TIME_ZONE = "America/New_York";

const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: COURSE_TIME_ZONE,
});

const dateFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  timeZone: COURSE_TIME_ZONE,
});

/** "2:00 PM" */
export function teeLabel(teeAt: string): string {
  return timeFormat.format(new Date(teeAt));
}

/** "Thursday, August 20" */
export function roundDateLabel(): string {
  return dateFormat.format(new Date(FIRST_TEE));
}

/** Whether a group is past its tee time. Drives "yet to tee off" copy. */
export function hasTeedOff(teeAt: string, now: Date = new Date()): boolean {
  return now.getTime() >= new Date(teeAt).getTime();
}
