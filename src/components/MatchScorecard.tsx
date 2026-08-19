"use client";

import { parForHole, segmentForHole } from "@/lib/course";
import { holeResult, playerScore, teamHoleScore, type MatchState } from "@/lib/scoring";
import { TEAMS, type Match, type TeamId } from "@/lib/tournament";
import { TEAM_STYLE } from "./ui";

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
                    {res === null ? (
                      <Blank />
                    ) : res === "halve" ? (
                      <span className="text-sm font-bold text-mute">½</span>
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
      className={`h-9 w-11 ${muted ? "text-sm text-mute" : "text-chalk"} ${
        turn ? "border-l-2 border-line" : ""
      } ${current ? "bg-chalk/8" : ""}`}
    >
      {children}
    </td>
  );
}
