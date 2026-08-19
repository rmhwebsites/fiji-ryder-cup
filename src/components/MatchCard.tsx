"use client";

import Link from "next/link";

import type { BeerStatus, MatchSummary } from "@/lib/scoring";
import {
  getMatch,
  teeLabel,
  TEAMS,
  type Match,
  type TeamId,
} from "@/lib/tournament";
import { BeerChip, SegmentPill, TEAM_STYLE } from "./ui";

const surname = (name: string) => name.split(" ").slice(-1)[0];

function ClockIcon({ className = "h-4 w-4" }: { className?: string }) {
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

/** One of the ten groups, as it appears on the board. */
export function MatchCard({
  summary,
  mine = false,
}: {
  summary: MatchSummary;
  /** The viewer's own group gets a ring, so they can find it in a list of ten. */
  mine?: boolean;
}) {
  const match = getMatch(summary.matchNo);
  if (!match) return null;

  const live = summary.started && !summary.complete;

  return (
    <Link
      href={`/match/${summary.matchNo}`}
      className={`block rounded-2xl border bg-ink-2 p-4 transition-colors active:bg-ink-3 ${
        mine ? "border-chalk/40 ring-2 ring-chalk/15" : "border-line"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="font-display text-base font-bold text-chalk">
            Match {summary.matchNo}
          </span>
          {mine && (
            <span className="rounded-full bg-chalk px-2 py-0.5 text-xs font-bold text-ink-2">
              Your group
            </span>
          )}
          {live && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-chalk/10 px-2 py-0.5 text-xs font-bold text-chalk">
              <span className="anim-live h-1.5 w-1.5 rounded-full bg-flag" />
              Live
            </span>
          )}
          {summary.complete && (
            <span className="rounded-full bg-line px-2 py-0.5 text-xs font-bold text-mute">
              Final
            </span>
          )}
        </span>
        {summary.started &&
          (summary.points.badgers > 0 || summary.points.gators > 0) && (
            <span className="font-display text-base font-bold tabular text-mute">
              {summary.points.badgers} – {summary.points.gators}
            </span>
          )}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
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
        <TeeTimeBar teeAt={match.teeAt} />
      )}
    </Link>
  );
}

/**
 * Stands in for the two match pills until a group posts its first score.
 * Nobody needs to see an empty scoreline for a group that has not teed off.
 */
export function TeeTimeBar({ teeAt }: { teeAt: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-ink-3/40 px-3 py-3">
      <ClockIcon className="h-4 w-4 text-mute" />
      <span className="text-sm font-semibold text-mute">Tees off</span>
      <span className="font-display text-base font-bold tabular text-chalk">
        {teeLabel(teeAt)}
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
      <p className={`text-sm font-bold ${TEAM_STYLE[team].text}`}>
        {TEAMS[team].shortName}
      </p>
      <p className="truncate text-base leading-snug font-semibold text-chalk">
        {surname(players[0].name)} / {surname(players[1].name)}
      </p>
      {started && (
        <div className={`mt-1.5 flex ${right ? "justify-end" : ""}`}>
          <BeerChip status={beers} />
        </div>
      )}
    </div>
  );
}
