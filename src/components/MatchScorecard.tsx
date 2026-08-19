"use client";

import { BEER_TARGET, parForHole, segmentForHole } from "@/lib/course";
import {
  holeBeers,
  holeResult,
  playerBeers,
  playerHoleBeers,
  playerScore,
  teamHoleScore,
  type BeerStatus,
  type MatchState,
} from "@/lib/scoring";
import { TEAMS, type Match, type TeamId } from "@/lib/tournament";
import { BeerIcon, TEAM_STYLE } from "./ui";

const HOLES = Array.from({ length: 18 }, (_, i) => i + 1);
const TEAM_ORDER: TeamId[] = ["badgers", "gators"];
const surname = (n: string) => n.split(" ").slice(-1)[0];

/** A cell that keeps the grid honest when there is nothing to show yet. */
const Blank = () => <span className="text-mute/40">·</span>;

/**
 * The whole match on one card: every individual score, and who took each hole.
 *
 * Eighteen columns do not fit a phone, so it scrolls sideways with the name
 * column pinned. Tapping a hole jumps the entry card below to it, which makes
 * this the fastest way to get back to a hole someone forgot to post.
 *
 * The front nine has two scores a side (best ball) and the back nine has one
 * (scramble), so the player rows simply run out at the turn — the shape of the
 * card shows the format changing.
 */
export function MatchScorecard({
  match,
  state,
  currentHole,
  onPickHole,
}: {
  match: Match;
  state: MatchState;
  currentHole: number;
  onPickHole: (hole: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-ink-2">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center text-base tabular">
          <thead>
            <tr>
              <Th sticky>Hole</Th>
              {HOLES.map((h) => (
                <th key={h} className="p-0">
                  <button
                    type="button"
                    onClick={() => onPickHole(h)}
                    aria-label={`Go to hole ${h}`}
                    aria-current={h === currentHole}
                    className={`h-9 w-11 font-bold ${
                      h === currentHole
                        ? "bg-chalk text-ink-2"
                        : "text-chalk active:bg-ink-3"
                    } ${h === 10 ? "border-l-2 border-line" : ""}`}
                  >
                    {h}
                  </button>
                </th>
              ))}
            </tr>
            <tr className="bg-ink-3/60">
              <Th sticky muted>
                Par
              </Th>
              {HOLES.map((h) => (
                <Td key={h} muted turn={h === 10}>
                  {parForHole(h)}
                </Td>
              ))}
            </tr>
          </thead>

          <tbody>
            {TEAM_ORDER.map((team) => (
              <TeamRows
                key={team}
                team={team}
                match={match}
                state={state}
                currentHole={currentHole}
              />
            ))}

            {/* Who took each hole */}
            <tr className="border-t-2 border-line bg-ink-3/60">
              <Th sticky muted>
                Hole won
              </Th>
              {HOLES.map((h) => {
                const res = holeResult(state, h);
                return (
                  <Td key={h} turn={h === 10} current={h === currentHole}>
                    {/* A halved hole is dead, so its square stays blank —
                        only a won hole earns a mark. */}
                    {res === null || res === "halve" ? (
                      <Blank />
                    ) : (
                      <span
                        className={`inline-block h-3 w-3 rounded-full ${
                          res === "badgers" ? "bg-badger" : "bg-gator"
                        }`}
                        aria-label={`${TEAMS[res].shortName} won hole ${h}`}
                      />
                    )}
                  </Td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <HolesWonList state={state} />
    </div>
  );
}

/** Every hole each side has won so far, lowest to highest. */
function HolesWonList({ state }: { state: MatchState }) {
  const won: Record<TeamId, number[]> = { badgers: [], gators: [] };
  for (const h of HOLES) {
    const res = holeResult(state, h);
    if (res === "badgers" || res === "gators") won[res].push(h);
  }

  return (
    <div className="grid grid-cols-1 gap-1.5 border-t border-line px-4 py-3 sm:grid-cols-2 sm:gap-3">
      {TEAM_ORDER.map((team) => (
        <p key={team} className="flex items-baseline gap-2 text-base">
          <span className={`shrink-0 font-bold ${TEAM_STYLE[team].text}`}>
            {TEAMS[team].shortName}
          </span>
          <span className="min-w-0 font-semibold tabular text-chalk">
            {won[team].length > 0 ? won[team].join(", ") : "—"}
          </span>
        </p>
      ))}
    </div>
  );
}

function TeamRows({
  team,
  match,
  state,
  currentHole,
}: {
  team: TeamId;
  match: Match;
  state: MatchState;
  currentHole: number;
}) {
  const style = TEAM_STYLE[team];

  return (
    <>
      {/* Best ball — the two individual cards, front nine only */}
      {[1, 2].map((slot) => (
        <tr key={slot} className="border-t border-line/70">
          <Th sticky>
            <span className="font-medium text-chalk">
              {surname(match[team][slot - 1].name)}
            </span>
          </Th>
          {HOLES.map((h) => {
            const value =
              segmentForHole(h) === "front"
                ? playerScore(state, team, h, slot)
                : null;
            return (
              <Td key={h} turn={h === 10} current={h === currentHole}>
                {segmentForHole(h) === "back" ? (
                  <span className="text-mute/30">–</span>
                ) : (
                  (value ?? <Blank />)
                )}
              </Td>
            );
          })}
        </tr>
      ))}

      {/* What the side actually posted on the hole */}
      <tr className={`border-t border-line ${style.bg}`}>
        <Th sticky>
          <span className={`font-bold ${style.text}`}>
            {TEAMS[team].shortName}
          </span>
        </Th>
        {HOLES.map((h) => (
          <Td key={h} turn={h === 10} current={h === currentHole}>
            <span className={`font-bold ${style.text}`}>
              {teamHoleScore(state, team, h) ?? <Blank />}
            </span>
          </Td>
        ))}
      </tr>
    </>
  );
}

function Th({
  children,
  sticky,
  muted,
}: {
  children: React.ReactNode;
  sticky?: boolean;
  muted?: boolean;
}) {
  return (
    <th
      scope="row"
      className={`px-3 py-2 text-left text-sm font-semibold whitespace-nowrap ${
        muted ? "text-mute" : "text-chalk"
      } ${sticky ? "sticky left-0 z-10 bg-ink-2 shadow-[1px_0_0_var(--color-line)]" : ""}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  muted,
  turn,
  current,
}: {
  children: React.ReactNode;
  muted?: boolean;
  turn?: boolean;
  current?: boolean;
}) {
  return (
    <td
      className={`h-9 w-11 min-w-11 ${muted ? "text-sm text-mute" : "text-chalk"} ${
        turn ? "border-l-2 border-line" : ""
      } ${current ? "bg-chalk/8" : ""}`}
    >
      {children}
    </td>
  );
}

/**
 * The beer card — the second scorecard of the day, kept at the bottom of every
 * matchup because it is the one people check after the golf is settled.
 *
 * Same bones as the match scorecard: names pinned, a column per hole, the
 * border at the turn. A zero-beer hole renders as a dot rather than a 0 so the
 * holes where something happened stand out.
 */
export function BeerScorecard({
  match,
  state,
  beers,
}: {
  match: Match;
  state: MatchState;
  beers: Record<TeamId, BeerStatus>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-ink-2">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <p className="flex items-center gap-2 text-base font-bold text-chalk">
          <BeerIcon className="h-5 w-5 text-beer" />
          Beers
        </p>
        <p className="text-base font-semibold tabular">
          <span className="text-badger">{beers.badgers.total}</span>
          <span className="text-mute"> – </span>
          <span className="text-gator">{beers.gators.total}</span>
          <span className="text-sm font-medium text-mute">
            {" "}
            of {BEER_TARGET} a side
          </span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center text-base tabular">
          <thead>
            <tr className="bg-ink-3/60">
              <Th sticky muted>
                Hole
              </Th>
              {HOLES.map((h) => (
                <Td key={h} muted turn={h === 10}>
                  {h}
                </Td>
              ))}
            </tr>
          </thead>
          <tbody>
            {TEAM_ORDER.map((team) => (
              <BeerTeamRows
                key={team}
                team={team}
                match={match}
                state={state}
                total={beers[team].total}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** One pairing on the beer card: each player's row, then the pairing total. */
function BeerTeamRows({
  team,
  match,
  state,
  total,
}: {
  team: TeamId;
  match: Match;
  state: MatchState;
  total: number;
}) {
  const style = TEAM_STYLE[team];

  return (
    <>
      {[1, 2].map((slot) => (
        <tr key={slot} className="border-t border-line/70">
          <Th sticky>
            <span className="font-medium text-chalk">
              {surname(match[team][slot - 1].name)}
            </span>
            <span className="ml-1.5 text-sm font-semibold text-beer">
              {playerBeers(state, team, slot)}
            </span>
          </Th>
          {HOLES.map((h) => {
            const n = playerHoleBeers(state, team, h, slot);
            return (
              <Td key={h} turn={h === 10}>
                {n > 0 ? (
                  <span className="font-bold text-beer">{n}</span>
                ) : (
                  <Blank />
                )}
              </Td>
            );
          })}
        </tr>
      ))}

      {/* The pairing total is what the 18-beer pace is measured against, and
          it can exceed the two player rows — beers logged before the per-player
          split still count here. */}
      <tr className={`border-t border-line ${style.bg}`}>
        <Th sticky>
          <span className={`font-bold ${style.text}`}>
            {TEAMS[team].shortName}
          </span>
          <span className="ml-1.5 text-sm font-semibold text-beer">{total}</span>
        </Th>
        {HOLES.map((h) => {
          const n = holeBeers(state, team, h);
          return (
            <Td key={h} turn={h === 10}>
              {n > 0 ? (
                <span className={`font-bold ${style.text}`}>{n}</span>
              ) : (
                <Blank />
              )}
            </Td>
          );
        })}
      </tr>
    </>
  );
}
