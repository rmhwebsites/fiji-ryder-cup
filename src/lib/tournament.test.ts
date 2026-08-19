import { describe, expect, it } from "vitest";

import { MATCHES } from "./tournament";

/** The draw exactly as it appears on the printed tee sheet. */
const TEE_SHEET: [number, string, string[], string[]][] = [
  [1, "2:00 PM", ["Chris Tanagho", "Henry Grimsley"], ["Hank Joiner", "Lohan Heyns"]],
  [2, "2:12 PM", ["Steele Alkhas", "Josh Brannan"], ["Zan Heick", "Ryan Huffman"]],
  [3, "2:24 PM", ["Charlie Sutton", "Kiran Proctor"], ["Will Jamieson", "Park Howell"]],
  [4, "2:36 PM", ["Grady Bryan", "Patrick Bryan"], ["Brock Liolios", "Andrew Elko"]],
  [5, "2:48 PM", ["Jack Voci", "Elijah Pay"], ["Tucker Robbins", "James Levien"]],
  [6, "3:00 PM", ["Becker Curry", "Clay Meredith"], ["Wade Tolbert", "Ryder Hilding"]],
  [7, "3:12 PM", ["Quinn Lyons", "Ethan Hiers"], ["Jack Fishpaw", "Trey Hill"]],
  [8, "3:24 PM", ["Blake Stern", "Ethan Golan"], ["Benny Evans", "Ryan Chain"]],
  [9, "3:36 PM", ["Campbell Gosslee", "Brooks Longgrear"], ["Will Strong", "Carson Griffey"]],
  [10, "3:48 PM", ["Cole Dewey", "Canon Brooks"], ["Preston Hidy", "Nick Pope"]],
];

describe("the draw", () => {
  it("matches the tee sheet group for group", () => {
    expect(MATCHES).toHaveLength(TEE_SHEET.length);
    for (const [no, teeTime, badgers, gators] of TEE_SHEET) {
      const match = MATCHES.find((m) => m.no === no);
      expect(match, `match ${no}`).toBeDefined();
      expect(match!.teeTime).toBe(teeTime);
      expect(match!.badgers.map((p) => p.name)).toEqual(badgers);
      expect(match!.gators.map((p) => p.name)).toEqual(gators);
    }
  });

  it("fields 40 players, 20 a side, nobody twice", () => {
    const badgers = MATCHES.flatMap((m) => m.badgers.map((p) => p.name));
    const gators = MATCHES.flatMap((m) => m.gators.map((p) => p.name));
    expect(badgers).toHaveLength(20);
    expect(gators).toHaveLength(20);
    expect(new Set([...badgers, ...gators]).size).toBe(40);
  });

  it("goes off in 12 minute intervals in numerical order", () => {
    const minutes = MATCHES.map((m) => {
      const [clock, meridiem] = m.teeTime.split(" ");
      const [h, min] = clock.split(":").map(Number);
      return ((h % 12) + (meridiem === "PM" ? 12 : 0)) * 60 + min;
    });
    for (let i = 1; i < minutes.length; i++) {
      expect(minutes[i] - minutes[i - 1]).toBe(12);
    }
  });

  it("keeps every handicap attached to its player", () => {
    // Spot-check the extremes from the original sheet — a renumbered draw
    // must not shuffle a handicap onto the wrong name.
    const byName = new Map(
      MATCHES.flatMap((m) => [...m.badgers, ...m.gators]).map((p) => [
        p.name,
        p.handicap,
      ]),
    );
    expect(byName.get("Chris Tanagho")).toBe(22);
    expect(byName.get("Preston Hidy")).toBe(-1);
    expect(byName.get("Campbell Gosslee")).toBe(1);
    expect(byName.get("Kiran Proctor")).toBe(3);
    expect(byName.get("Ryan Chain")).toBe(19);
    expect(byName.get("Jack Fishpaw")).toBe(5);
  });
});
