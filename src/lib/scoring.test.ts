import { describe, expect, it } from "vitest";

import {
  beerStatus,
  buildMatchStates,
  computeStandings,
  emptyMatchState,
  holeResult,
  segmentStatus,
  strokeKey,
  summarizeMatch,
  teamHoleScore,
  type BeerRow,
  type MatchState,
  type ScoreRow,
} from "./scoring";
import type { TeamId } from "./tournament";

/** Helper: set a front-nine best-ball hole for both teams. */
function setFront(
  state: MatchState,
  hole: number,
  badgers: [number, number],
  gators: [number, number],
) {
  state.strokes.set(strokeKey("badgers", hole, 1), badgers[0]);
  state.strokes.set(strokeKey("badgers", hole, 2), badgers[1]);
  state.strokes.set(strokeKey("gators", hole, 1), gators[0]);
  state.strokes.set(strokeKey("gators", hole, 2), gators[1]);
}

/** Helper: set a back-nine scramble hole for both teams. */
function setBack(
  state: MatchState,
  hole: number,
  badgers: number,
  gators: number,
) {
  state.strokes.set(strokeKey("badgers", hole, 0), badgers);
  state.strokes.set(strokeKey("gators", hole, 0), gators);
}

describe("teamHoleScore", () => {
  it("takes the lower ball on the front nine", () => {
    const s = emptyMatchState();
    setFront(s, 1, [5, 4], [6, 7]);
    expect(teamHoleScore(s, "badgers", 1)).toBe(4);
    expect(teamHoleScore(s, "gators", 1)).toBe(6);
  });

  it("stands on a single entry when a partner picks up", () => {
    const s = emptyMatchState();
    s.strokes.set(strokeKey("badgers", 1, 1), 5);
    expect(teamHoleScore(s, "badgers", 1)).toBe(5);
  });

  it("uses the single scramble score on the back nine", () => {
    const s = emptyMatchState();
    setBack(s, 10, 4, 5);
    expect(teamHoleScore(s, "badgers", 10)).toBe(4);
  });

  it("is null before anything is entered", () => {
    expect(teamHoleScore(emptyMatchState(), "badgers", 1)).toBeNull();
  });
});

describe("holeResult", () => {
  it("awards the hole to the lower score and halves ties", () => {
    const s = emptyMatchState();
    setFront(s, 1, [4, 5], [5, 5]);
    setFront(s, 2, [6, 6], [4, 9]);
    setFront(s, 3, [4, 8], [4, 6]);
    expect(holeResult(s, 1)).toBe("badgers");
    expect(holeResult(s, 2)).toBe("gators");
    expect(holeResult(s, 3)).toBe("halve");
  });

  it("stays null until both teams post", () => {
    const s = emptyMatchState();
    s.strokes.set(strokeKey("badgers", 1, 1), 4);
    expect(holeResult(s, 1)).toBeNull();
  });
});

describe("segmentStatus", () => {
  it("reports a live lead with holes remaining", () => {
    const s = emptyMatchState();
    setFront(s, 1, [4, 4], [5, 5]); // badgers
    setFront(s, 2, [4, 4], [5, 5]); // badgers
    setFront(s, 3, [4, 4], [4, 4]); // halve

    const status = segmentStatus(s, "front");
    expect(status.leader).toBe("badgers");
    expect(status.up).toBe(2);
    expect(status.thru).toBe(3);
    expect(status.remaining).toBe(6);
    expect(status.finished).toBe(false);
    expect(status.result).toBe("2 UP");
    expect(status.points).toEqual({ badgers: 0, gators: 0 });
  });

  it("closes a match out as 3&2", () => {
    const s = emptyMatchState();
    // Badgers win 1,2,3; halve 4,5,6; win 7 -> 4 up with 2 to play.
    for (const hole of [1, 2, 3]) setFront(s, hole, [4, 4], [5, 5]);
    for (const hole of [4, 5, 6]) setFront(s, hole, [4, 4], [4, 4]);
    setFront(s, 7, [4, 4], [5, 5]);

    const status = segmentStatus(s, "front");
    expect(status.finished).toBe(true);
    expect(status.closedOut).toBe(true);
    expect(status.result).toBe("4&2");
    expect(status.points).toEqual({ badgers: 1, gators: 0 });
  });

  it("does not close out when the lead only equals the holes left", () => {
    const s = emptyMatchState();
    // Badgers 1 up through 8 -> 1 up with 1 to play, still alive (dormie).
    setFront(s, 1, [4, 4], [5, 5]);
    for (const hole of [2, 3, 4, 5, 6, 7, 8]) setFront(s, hole, [4, 4], [4, 4]);

    const status = segmentStatus(s, "front");
    expect(status.finished).toBe(false);
    expect(status.remaining).toBe(1);
    expect(status.result).toBe("1 UP");
  });

  it("finishes 1 UP when the last hole is halved", () => {
    const s = emptyMatchState();
    setFront(s, 1, [4, 4], [5, 5]);
    for (const hole of [2, 3, 4, 5, 6, 7, 8, 9]) {
      setFront(s, hole, [4, 4], [4, 4]);
    }

    const status = segmentStatus(s, "front");
    expect(status.finished).toBe(true);
    expect(status.closedOut).toBe(false);
    expect(status.result).toBe("1 UP");
    expect(status.points).toEqual({ badgers: 1, gators: 0 });
  });

  it("halves a nine that finishes all square", () => {
    const s = emptyMatchState();
    setFront(s, 1, [4, 4], [5, 5]); // badgers
    setFront(s, 2, [5, 5], [4, 4]); // gators
    for (const hole of [3, 4, 5, 6, 7, 8, 9]) setFront(s, hole, [4, 4], [4, 4]);

    const status = segmentStatus(s, "front");
    expect(status.finished).toBe(true);
    expect(status.leader).toBeNull();
    expect(status.result).toBe("AS");
    expect(status.points).toEqual({ badgers: 0.5, gators: 0.5 });
  });

  it("scores the back nine off scramble entries", () => {
    const s = emptyMatchState();
    for (const hole of [10, 11, 12, 13, 14]) setBack(s, hole, 4, 5);
    const status = segmentStatus(s, "back");
    expect(status.leader).toBe("badgers");
    expect(status.finished).toBe(true);
    expect(status.result).toBe("5&4");
  });

  it("keeps the two nines independent", () => {
    const s = emptyMatchState();
    for (const hole of [1, 2, 3, 4, 5]) setFront(s, hole, [4, 4], [5, 5]);
    for (const hole of [10, 11, 12, 13, 14]) setBack(s, hole, 5, 4);

    expect(segmentStatus(s, "front").leader).toBe("badgers");
    expect(segmentStatus(s, "back").leader).toBe("gators");
    expect(summarizeMatch(1, s).points).toEqual({ badgers: 1, gators: 1 });
  });

  it("is untouched before any score lands", () => {
    const status = segmentStatus(emptyMatchState(), "front");
    expect(status.started).toBe(false);
    expect(status.result).toBe("AS");
    expect(status.finished).toBe(false);
  });
});

describe("beerStatus", () => {
  it("calls one per hole on pace", () => {
    expect(beerStatus(6, 6).pace).toBe("on-pace");
    expect(beerStatus(5, 6).pace).toBe("on-pace");
    expect(beerStatus(7, 6).pace).toBe("ahead");
  });

  it("flags a pairing that is lagging", () => {
    expect(beerStatus(4, 6).pace).toBe("behind");
    expect(beerStatus(1, 6).pace).toBe("parched");
  });

  it("celebrates a pairing well clear of pace", () => {
    expect(beerStatus(10, 6).pace).toBe("sending");
    expect(beerStatus(10, 6).label).toBe("SENDING IT");
  });

  it("caps expectation at the 18-beer requirement", () => {
    const status = beerStatus(18, 18);
    expect(status.expected).toBe(18);
    expect(status.remaining).toBe(0);
    expect(status.progress).toBe(1);
  });

  it("does not nag before the round starts", () => {
    expect(beerStatus(0, 0).pace).toBe("idle");
  });
});

describe("computeStandings", () => {
  it("totals points and beers across every match", () => {
    const scores: ScoreRow[] = [];
    const beers: BeerRow[] = [];

    const winFront = (matchNo: number, winner: TeamId) => {
      const loser: TeamId = winner === "badgers" ? "gators" : "badgers";
      for (let hole = 1; hole <= 5; hole++) {
        for (const slot of [1, 2]) {
          scores.push({ matchNo, hole, team: winner, slot, strokes: 4 });
          scores.push({ matchNo, hole, team: loser, slot, strokes: 5 });
        }
      }
    };

    winFront(1, "badgers");
    winFront(2, "gators");
    beers.push({ matchNo: 1, hole: 1, team: "badgers", beers: 3 });
    beers.push({ matchNo: 1, hole: 2, team: "badgers", beers: 2 });
    beers.push({ matchNo: 2, hole: 1, team: "gators", beers: 4 });

    const standings = computeStandings(buildMatchStates(scores, beers));
    expect(standings.points).toEqual({ badgers: 1, gators: 1 });
    expect(standings.beers).toEqual({ badgers: 5, gators: 4 });
    expect(standings.segmentsComplete).toBe(2);
    expect(standings.segmentsRemaining).toBe(18);
    expect(standings.matches).toHaveLength(10);
  });

  it("starts everyone at zero", () => {
    const standings = computeStandings(buildMatchStates([], []));
    expect(standings.points).toEqual({ badgers: 0, gators: 0 });
    expect(standings.segmentsRemaining).toBe(20);
  });
});

describe("no carryover — halved holes just die", () => {
  it("leaves the match where it stood", () => {
    const s = emptyMatchState();
    setFront(s, 1, [4, 4], [5, 5]); // badgers, 1 up
    setFront(s, 2, [4, 4], [4, 4]); // halve
    setFront(s, 3, [4, 4], [4, 4]); // halve
    setFront(s, 4, [4, 4], [4, 4]); // halve

    const status = segmentStatus(s, "front");
    // Three halves in a row are worth nothing to anybody.
    expect(status.up).toBe(1);
    expect(status.leader).toBe("badgers");
    expect(status.thru).toBe(4);
  });

  it("lets a nine of nothing but halves finish level", () => {
    const s = emptyMatchState();
    for (let hole = 1; hole <= 9; hole++) setFront(s, hole, [4, 4], [4, 4]);

    const status = segmentStatus(s, "front");
    expect(status.finished).toBe(true);
    expect(status.leader).toBeNull();
    expect(status.result).toBe("AS");
    expect(status.points).toEqual({ badgers: 0.5, gators: 0.5 });
  });

  it("ties a nine where each side wins the same number of holes", () => {
    const s = emptyMatchState();
    setFront(s, 1, [4, 4], [5, 5]); // badgers
    setFront(s, 2, [4, 4], [5, 5]); // badgers
    setFront(s, 3, [5, 5], [4, 4]); // gators
    setFront(s, 4, [5, 5], [4, 4]); // gators
    for (const hole of [5, 6, 7, 8, 9]) setFront(s, hole, [4, 4], [4, 4]);

    const status = segmentStatus(s, "front");
    expect(status.points).toEqual({ badgers: 0.5, gators: 0.5 });
  });
});

describe("cup arithmetic", () => {
  it("splits a point when a nine is halved and awards a full one when it is won", () => {
    const s = emptyMatchState();
    // Front halved, back won by the gators.
    for (let hole = 1; hole <= 9; hole++) setFront(s, hole, [4, 4], [4, 4]);
    for (const hole of [10, 11, 12, 13, 14]) setBack(s, hole, 5, 4);

    const summary = summarizeMatch(1, s);
    expect(summary.front.points).toEqual({ badgers: 0.5, gators: 0.5 });
    expect(summary.back.points).toEqual({ badgers: 0, gators: 1 });
    expect(summary.points).toEqual({ badgers: 0.5, gators: 1.5 });
  });

  it("can end 10-10 with every point on the board", () => {
    const scores: ScoreRow[] = [];
    // Halve all twenty nines: every hole tied on both nines of all ten matches.
    for (let matchNo = 1; matchNo <= 10; matchNo++) {
      for (let hole = 1; hole <= 9; hole++) {
        for (const team of ["badgers", "gators"] as TeamId[]) {
          for (const slot of [1, 2]) {
            scores.push({ matchNo, hole, team, slot, strokes: 4 });
          }
        }
      }
      for (let hole = 10; hole <= 18; hole++) {
        for (const team of ["badgers", "gators"] as TeamId[]) {
          scores.push({ matchNo, hole, team, slot: 0, strokes: 4 });
        }
      }
    }

    const standings = computeStandings(buildMatchStates(scores, []));
    expect(standings.points).toEqual({ badgers: 10, gators: 10 });
    expect(standings.segmentsComplete).toBe(20);
    expect(standings.segmentsRemaining).toBe(0);
  });
});
