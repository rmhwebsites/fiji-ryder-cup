"use client";

import Link from "next/link";

import type { MatchSummary } from "@/lib/scoring";
import { getMatch, TEAMS, type TeamId } from "@/lib/tournament";
import { BeerChip, SegmentPill, TEAM_STYLE } from "./ui";

const surname = (name: string) => name.split(" ").slice(-1)[0];

/** One of the ten groups, as it appears on the leaderboard. */
export function MatchCard({ summary }: { summary: MatchSummary }) {
  const match = getMatch(summary.matchNo);
  if (!match) return null;

  const live = summary.started && !summary.complete;

  return (
    <Link
      href={`/match/${summary.matchNo}`}
      className="block rounded-2xl border border-line bg-ink-2 p-3 transition-colors active:bg-ink-3"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="font-display text-[11px] font-black tracking-[0.16em] text-mute">
            MATCH {summary.matchNo}
          </span>
          {live && (
            <span className="inline-flex items-center gap-1 rounded-full bg-chalk/12 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-chalk">
              <span className="anim-live h-1 w-1 rounded-full bg-chalk" />
              LIVE
            </span>
          )}
          {summary.complete && (
            <span className="rounded-full bg-line/60 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-mute">
              FINAL
            </span>
          )}
        </span>
        <span className="font-display text-xs font-black tabular text-mute">
          {summary.points.badgers > 0 || summary.points.gators > 0
            ? `${summary.points.badgers} – ${summary.points.gators}`
            : ""}
        </span>
      </div>

      <div className="mb-2.5 grid grid-cols-2 gap-2">
        <PairingLine team="badgers" match={match} beers={summary.beers.badgers} />
        <PairingLine
          team="gators"
          match={match}
          beers={summary.beers.gators}
          align="right"
        />
      </div>

      <div className="flex gap-2">
        <SegmentPill status={summary.front} />
        <SegmentPill status={summary.back} />
      </div>
    </Link>
  );
}

function PairingLine({
  team,
  match,
  beers,
  align = "left",
}: {
  team: TeamId;
  match: NonNullable<ReturnType<typeof getMatch>>;
  beers: MatchSummary["beers"][TeamId];
  align?: "left" | "right";
}) {
  const right = align === "right";
  const players = match[team];

  return (
    <div className={right ? "text-right" : ""}>
      <p
        className={`text-[9px] font-black tracking-[0.14em] ${TEAM_STYLE[team].text}`}
      >
        {TEAMS[team].shortName.toUpperCase()}
      </p>
      <p className="truncate text-sm leading-tight font-bold text-chalk">
        {surname(players[0].name)} / {surname(players[1].name)}
      </p>
      <div className={`mt-1 flex ${right ? "justify-end" : ""}`}>
        <BeerChip status={beers} />
      </div>
    </div>
  );
}
