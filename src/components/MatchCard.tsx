"use client";

import Link from "next/link";

import { SEGMENT_META, BEER_TARGET } from "@/lib/course";
import type { MatchSummary, SegmentStatus } from "@/lib/scoring";
import {
  getMatch,
  teeLabel,
  TEAMS,
  type Match,
  type TeamId,
} from "@/lib/tournament";
import { BeerIcon, TEAM_STYLE } from "./ui";

const surname = (name: string) => name.split(" ").slice(-1)[0];

/**
 * One group on the board, laid out like a game row: pairings stacked on the
 * left, the score of the nine being played on the right, one thin beer bar
 * underneath. Flat on purpose — the numbers do the talking.
 */
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
  const nine = summary.current;

  return (
    <Link
      href={`/match/${summary.matchNo}`}
      className={`block rounded-2xl border bg-ink-2 px-4 py-3.5 transition-colors active:bg-ink-3 ${
        mine ? "border-chalk/40 ring-2 ring-chalk/15" : "border-line"
      }`}
    >
      {/* Header: which match, where they are */}
      <div className="flex items-baseline justify-between gap-2 text-sm font-semibold text-mute">
        <span className="flex items-baseline gap-2">
          Match {summary.matchNo}
          {mine && <span className="font-bold text-chalk">· Yours</span>}
          {/* A settled front nine stays visible while the back is live. */}
          {live && nine.segment === "back" && summary.front.finished && (
            <FinishedNine status={summary.front} />
          )}
        </span>
        <span className="shrink-0 tabular">
          {summary.complete
            ? "Final"
            : live
              ? `Hole ${summary.currentHole} · ${SEGMENT_META[nine.segment].label}`
              : `Tees off ${teeLabel(match.teeAt)}`}
        </span>
      </div>

      {/* Pairings + the score that matters right now */}
      <div className="mt-2.5 flex items-center gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <PairingRow team="badgers" match={match} summary={summary} />
          <PairingRow team="gators" match={match} summary={summary} />
        </div>

        {live && <NineScore status={nine} />}
        {summary.complete && (
          <p className="shrink-0 text-right font-display text-2xl font-extrabold tabular text-chalk">
            {summary.points.badgers}–{summary.points.gators}
          </p>
        )}
      </div>

      {summary.started && <BeerBar summary={summary} />}
    </Link>
  );
}

/** One pairing: dot, surnames, and their points so far. */
function PairingRow({
  team,
  match,
  summary,
}: {
  team: TeamId;
  match: Match;
  summary: MatchSummary;
}) {
  const nine = summary.current;
  // While a nine is live the leader reads at full strength and the trailer
  // recedes; before the first score everyone stands equal.
  const dim =
    summary.started && !summary.complete && nine.leader !== null
      ? nine.leader !== team
      : false;

  return (
    <p
      className={`flex items-center gap-2 text-base font-semibold ${
        dim ? "text-mute" : "text-chalk"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
          team === "badgers" ? "bg-badger" : "bg-gator"
        }`}
        aria-hidden
      />
      <span className="truncate">
        {surname(match[team][0].name)} / {surname(match[team][1].name)}
      </span>
    </p>
  );
}

/** The live nine's score: "2 UP, Badgers thru 3" or "TIE thru 4". */
function NineScore({ status }: { status: SegmentStatus }) {
  const style = status.leader ? TEAM_STYLE[status.leader] : null;
  return (
    <div className="shrink-0 text-right">
      <p
        className={`font-display text-2xl leading-none font-extrabold tabular ${
          style ? style.text : "text-chalk"
        }`}
      >
        {status.result}
      </p>
      <p className="mt-1 text-sm font-medium text-mute">
        {status.leader ? `${TEAMS[status.leader].shortName} · ` : ""}
        thru {status.thru}
      </p>
    </div>
  );
}

/** "F9 3&2 HB" — the nine already in the bank, kept to a whisper. */
function FinishedNine({ status }: { status: SegmentStatus }) {
  const style = status.leader ? TEAM_STYLE[status.leader] : null;
  return (
    <span className={`tabular ${style ? style.text : ""}`}>
      · F9 {status.result}
      {status.leader ? ` ${TEAMS[status.leader].abbr}` : ""}
    </span>
  );
}

/**
 * Beers as a status bar, not a feature: two thin fills racing toward 18 from
 * either end, a number at each side, no verdicts.
 */
function BeerBar({ summary }: { summary: MatchSummary }) {
  const b = summary.beers.badgers.total;
  const g = summary.beers.gators.total;
  const pct = (n: number) => Math.min((n / BEER_TARGET) * 100, 100);

  return (
    <div className="mt-3 flex items-center gap-2 text-sm font-semibold tabular text-mute">
      <BeerIcon className="h-3.5 w-3.5 shrink-0" />
      <span className="w-5 text-right">{b}</span>
      <span className="h-1 flex-1 overflow-hidden rounded-full bg-line/70">
        <span
          className="block h-full rounded-full bg-badger/60"
          style={{ width: `${pct(b)}%` }}
        />
      </span>
      <span className="h-1 flex-1 overflow-hidden rounded-full bg-line/70">
        <span
          className="ml-auto block h-full rounded-full bg-gator/60"
          style={{ width: `${pct(g)}%` }}
        />
      </span>
      <span className="w-5">{g}</span>
    </div>
  );
}

/**
 * Stands in for a score until a group posts one — also used by the group page
 * header before play starts.
 */
export function TeeTimeBar({ teeAt }: { teeAt: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-ink-3/40 px-3 py-3">
      <span className="text-sm font-semibold text-mute">Tees off</span>
      <span className="font-display text-base font-bold tabular text-chalk">
        {teeLabel(teeAt)}
      </span>
    </div>
  );
}
