"use client";

import Link from "next/link";

import type { BeerStatus, MatchSummary } from "@/lib/scoring";
import { getMatch, TEAMS, type Match, type TeamId } from "@/lib/tournament";
import { BeerChip, SegmentPill, TEAM_STYLE } from "./ui";

const surname = (name: string) => name.split(" ").slice(-1)[0];

function ClockIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

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
            <span className="inline-flex items-center gap-1 rounded-full bg-chalk/10 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-chalk">
              <span className="anim-live h-1 w-1 rounded-full bg-flag" />
              LIVE
            </span>
          )}
          {summary.complete && (
            <span className="rounded-full bg-line px-1.5 py-0.5 text-[9px] font-black tracking-wider text-mute">
              FINAL
            </span>
          )}
        </span>
        {summary.started &&
          (summary.points.badgers > 0 || summary.points.gators > 0) && (
            <span className="font-display text-xs font-black tabular text-mute">
              {summary.points.badgers} – {summary.points.gators}
            </span>
          )}
      </div>

      <div className="mb-2.5 grid grid-cols-2 gap-2">
        <PairingLine
          team="badgers"
          match={match}
          beers={summary.beers.badgers}
          started={summary.started}
        />
        <PairingLine
          team="gators"
          match={match}
          beers={summary.beers.gators}
          started={summary.started}
          align="right"
        />
      </div>

      {summary.started ? (
        <div className="flex gap-2">
          <SegmentPill status={summary.front} />
          <SegmentPill status={summary.back} />
        </div>
      ) : (
        <TeeTimeBar teeTime={match.teeTime} />
      )}
    </Link>
  );
}

/**
 * Stands in for the two match pills until a group posts its first score.
 * Nobody needs to see an empty scoreline for a group that has not teed off.
 */
export function TeeTimeBar({ teeTime }: { teeTime: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-ink-3/40 px-3 py-2.5">
      <ClockIcon className="h-3.5 w-3.5 text-mute" />
      <span className="text-[10px] font-black tracking-[0.16em] text-mute">
        TEES OFF
      </span>
      <span className="font-display text-sm font-black tabular text-chalk">
        {teeTime}
      </span>
    </div>
  );
}

function PairingLine({
  team,
  match,
  beers,
  started,
  align = "left",
}: {
  team: TeamId;
  match: Match;
  beers: BeerStatus;
  started: boolean;
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
      {started && (
        <div className={`mt-1 flex ${right ? "justify-end" : ""}`}>
          <BeerChip status={beers} />
        </div>
      )}
    </div>
  );
}
