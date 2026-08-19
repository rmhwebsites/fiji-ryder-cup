"use client";

import { claim, release, useIdentity } from "@/lib/identity";
import {
  getMatch,
  MATCHES,
  teeLabel,
  TEAMS,
  type TeamId,
} from "@/lib/tournament";
import { GroupScorecard } from "@/components/GroupScorecard";
import { PinPrompt, usePinGate } from "@/components/PinGate";
import { useLive } from "@/components/TournamentProvider";
import { LiveDot, TEAM_STYLE } from "@/components/ui";

const TEAM_ORDER: TeamId[] = ["badgers", "gators"];

/**
 * The players' tab, and the only place the scoring code lives.
 *
 * Three states, in order, each one done once: unlock with the code, claim your
 * group, then keep the card. The claim sticks to the phone, so the next time
 * someone opens the app on the 4th tee they land straight on their scorecard.
 */
export default function PlayersPage() {
  const unlocked = usePinGate();
  const me = useIdentity();
  const { connection, pending } = useLive();

  return (
    <main className="px-3 pb-4">
      <header className="flex items-start justify-between gap-3 px-1 pt-6 pb-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl leading-tight font-extrabold tracking-tight">
            Players
          </h1>
          <p className="mt-1 text-base font-medium text-mute">
            {!unlocked
              ? "Enter the scoring code to keep your group's card"
              : !me
                ? "Pick your group — you only do this once"
                : "Your card. Any of the four of you can enter a score."}
          </p>
        </div>
        <div className="pt-1">
          <LiveDot connection={connection} pending={pending} />
        </div>
      </header>

      {!unlocked ? (
        <PinPrompt />
      ) : !me ? (
        <GroupPicker />
      ) : (
        <ClaimedCard matchNo={me.matchNo} team={me.team} />
      )}
    </main>
  );
}

/** Ten groups, twenty pairings, one tap. */
function GroupPicker() {
  return (
    <div className="space-y-3">
      {MATCHES.map((match) => (
        <div
          key={match.no}
          className="rounded-2xl border border-line bg-ink-2 p-4"
        >
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <p className="font-display text-base font-bold text-chalk">
              Match {match.no}
            </p>
            <p className="text-sm font-semibold tabular text-mute">
              {teeLabel(match.teeAt)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {TEAM_ORDER.map((team) => (
              <button
                key={team}
                type="button"
                onClick={() => claim(match.no, team)}
                className={`rounded-xl border p-3 text-left transition-colors active:scale-[0.98] ${TEAM_STYLE[team].border} ${TEAM_STYLE[team].bg}`}
              >
                <p className={`text-sm font-bold ${TEAM_STYLE[team].text}`}>
                  {TEAMS[team].shortName}
                </p>
                <p className="mt-0.5 text-base leading-snug font-semibold text-chalk">
                  {match[team][0].name}
                </p>
                <p className="text-base leading-snug font-semibold text-chalk">
                  {match[team][1].name}
                </p>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The claimed group. Who you are is one quiet line — the scores go at the top
 * because entering them is the whole reason this tab exists.
 */
function ClaimedCard({ matchNo, team }: { matchNo: number; team: TeamId }) {
  const match = getMatch(matchNo);
  if (!match) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="min-w-0 truncate text-base font-semibold text-chalk">
          <span className={`font-bold ${TEAM_STYLE[team].text}`}>
            Match {matchNo}
          </span>
          <span className="text-mute"> · </span>
          {match[team][0].name.split(" ")[0]} &amp;{" "}
          {match[team][1].name.split(" ")[0]}
        </p>
        <button
          type="button"
          onClick={release}
          className="shrink-0 text-sm font-semibold text-mute underline-offset-4 active:opacity-60 hover:underline"
        >
          Not you?
        </button>
      </div>

      <GroupScorecard matchNo={matchNo} editable />
    </div>
  );
}
