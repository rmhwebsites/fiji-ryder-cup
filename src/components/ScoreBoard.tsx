"use client";

import { BEER_TARGET } from "@/lib/course";
import type { Standings } from "@/lib/scoring";
import {
  MATCHES,
  POINTS_TO_WIN,
  TEAMS,
  TOTAL_POINTS,
  type TeamId,
} from "@/lib/tournament";
import { BeerIcon } from "./ui";

const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

/** Total beers a team is on the hook for: 10 pairings x 18. */
const TEAM_BEER_TARGET = MATCHES.length * BEER_TARGET;

/**
 * The hero. Points on top, a tug-of-war bar in the middle, the beer race
 * underneath — the three things anyone glancing at a phone actually wants.
 */
export function ScoreBoard({ standings }: { standings: Standings }) {
  const { points, beers } = standings;
  const leader: TeamId | null =
    points.badgers > points.gators
      ? "badgers"
      : points.gators > points.badgers
        ? "gators"
        : null;

  const decided = points.badgers + points.gators;
  // Split the bar by points won, with the undecided remainder held in the
  // middle so the two sides visibly close in on each other as nines finish.
  const badgerShare = (points.badgers / TOTAL_POINTS) * 100;
  const gatorShare = (points.gators / TOTAL_POINTS) * 100;

  const status =
    points.badgers >= POINTS_TO_WIN
      ? `${TEAMS.badgers.name} win the cup`
      : points.gators >= POINTS_TO_WIN
        ? `${TEAMS.gators.name} win the cup`
        : decided === TOTAL_POINTS
          ? "Cup tied 10–10"
          : leader
            ? `${TEAMS[leader].shortName} lead · ${fmt(POINTS_TO_WIN - points[leader])} to clinch`
            : "All square";

  return (
    <section className="px-3 pt-2">
      <div className="overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-ink-3 to-ink-2 shadow-2xl">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pt-5 pb-4">
          <TeamScore team="badgers" value={points.badgers} leading={leader === "badgers"} />
          <div className="pb-1 text-center">
            <p className="font-display text-[10px] font-bold tracking-[0.2em] text-mute">
              VS
            </p>
          </div>
          <TeamScore team="gators" value={points.gators} leading={leader === "gators"} align="right" />
        </div>

        {/* Tug of war */}
        <div className="px-4">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-ink">
            <div
              className="anim-bar h-full bg-gradient-to-r from-badger-dim to-badger"
              style={{ width: `${badgerShare}%` }}
            />
            <div className="h-full flex-1 bg-line/40" />
            <div
              className="anim-bar h-full bg-gradient-to-l from-gator-dim to-gator"
              style={{ width: `${gatorShare}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] font-bold tracking-widest whitespace-nowrap text-mute">
            <span>{fmt(POINTS_TO_WIN)} TO WIN</span>
            <span>{TOTAL_POINTS} PTS</span>
          </div>
          <p className="mt-1.5 text-center text-[11px] leading-tight font-black tracking-[0.12em] text-chalk">
            {status.toUpperCase()}
          </p>
        </div>

        {/* Beer race */}
        <div className="mt-4 grid grid-cols-2 gap-px border-t border-line bg-line">
          <BeerSide total={beers.badgers} />
          <BeerSide total={beers.gators} align="right" />
        </div>
      </div>
    </section>
  );
}

function TeamScore({
  team,
  value,
  leading,
  align = "left",
}: {
  team: TeamId;
  value: number;
  leading: boolean;
  align?: "left" | "right";
}) {
  const color = team === "badgers" ? "text-badger" : "text-gator";
  const right = align === "right";

  return (
    <div className={right ? "text-right" : "text-left"}>
      <p
        className={`text-[11px] leading-tight font-bold tracking-[0.14em] ${
          leading ? color : "text-mute"
        }`}
      >
        {TEAMS[team].name.toUpperCase()}
      </p>
      <p
        className={`font-display text-6xl leading-none font-black tabular ${color} ${
          leading ? "drop-shadow-[0_0_22px_currentColor]" : "opacity-85"
        }`}
      >
        {fmt(value)}
      </p>
    </div>
  );
}

function BeerSide({
  total,
  align = "left",
}: {
  total: number;
  align?: "left" | "right";
}) {
  const pct = Math.min((total / TEAM_BEER_TARGET) * 100, 100);
  const right = align === "right";

  return (
    <div className={`bg-ink-2 px-4 py-3 ${right ? "text-right" : ""}`}>
      <div
        className={`flex items-center gap-1.5 text-beer ${right ? "justify-end" : ""}`}
      >
        <BeerIcon className="h-4 w-4" />
        <span className="font-display text-xl font-black tabular">{total}</span>
        <span className="text-[10px] font-bold text-mute">
          / {TEAM_BEER_TARGET}
        </span>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-ink">
        <div
          className={`anim-bar h-full rounded-full bg-gradient-to-r from-beer/50 to-beer ${
            right ? "ml-auto" : ""
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
