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
  badgers: [Player, Player];
  gators: [Player, Player];
}

export const MATCHES: Match[] = [
  {
    no: 1,
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
    no: 4,
    badgers: [
      { name: "Quinn Lyons", handicap: 9 },
      { name: "Ethan Hiers", handicap: 12 },
    ],
    gators: [
      { name: "Trey Hill", handicap: 10 },
      { name: "Jack Fishpaw", handicap: 5 },
    ],
  },
  {
    no: 5,
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
    no: 6,
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
    no: 8,
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
    no: 9,
    badgers: [
      { name: "Cole Dewey", handicap: 3 },
      { name: "Canon Brooks", handicap: 9 },
    ],
    gators: [
      { name: "Preston Hidy", handicap: -1 },
      { name: "Nick Pope", handicap: 8 },
    ],
  },
  {
    no: 10,
    badgers: [
      { name: "Campbell Gosslee", handicap: 1 },
      { name: "Brooks Longgrear", handicap: 7 },
    ],
    gators: [
      { name: "Will Strong", handicap: 3 },
      { name: "Carson Griffey", handicap: 10 },
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
