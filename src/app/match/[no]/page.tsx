"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { useIdentity } from "@/lib/identity";
import { getMatch, teeLabel } from "@/lib/tournament";
import { GroupScorecard } from "@/components/GroupScorecard";
import { useLive } from "@/components/TournamentProvider";

const surname = (n: string) => n.split(" ").slice(-1)[0];

/**
 * One group's card, open to anyone.
 *
 * Read-only on purpose. Watching the scores needs no code and no claim — the
 * whole point is that the twenty people not in this group can follow it. Every
 * write happens in the Players tab, which is the only screen that asks for the
 * code at all.
 */
export default function MatchPage() {
  const params = useParams<{ no: string }>();
  const router = useRouter();
  const matchNo = Number(params.no);

  const { standings } = useLive();
  const me = useIdentity();

  const match = getMatch(matchNo);
  const summary = standings.matches.find((m) => m.matchNo === matchNo);

  if (!match || !summary || Number.isNaN(matchNo)) {
    return (
      <main className="px-4 pt-16 text-center">
        <p className="font-display text-xl font-bold">No such match</p>
        <Link
          href="/"
          className="mt-3 inline-block text-base font-semibold text-mute underline"
        >
          Back to the board
        </Link>
      </main>
    );
  }

  const isMine = me?.matchNo === matchNo;

  return (
    <main className="px-3 pb-4">
      <header className="flex items-center gap-3 px-1 pt-6 pb-4">
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="Back to the board"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-ink-2 text-mute active:scale-90"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl leading-tight font-extrabold tracking-tight">
            Match {matchNo}
          </h1>
          <p className="mt-0.5 truncate text-base font-medium text-mute">
            {surname(match.badgers[0].name)} / {surname(match.badgers[1].name)}
            {" vs "}
            {surname(match.gators[0].name)} / {surname(match.gators[1].name)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-medium text-mute">Tee</p>
          <p className="font-display text-base font-bold tabular text-chalk">
            {teeLabel(match.teeAt)}
          </p>
        </div>
      </header>

      {isMine && (
        <Link
          href="/players"
          className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-chalk/30 bg-ink-2 p-4 ring-2 ring-chalk/10 active:scale-[0.99]"
        >
          <span>
            <span className="block text-base font-bold text-chalk">
              This is your group
            </span>
            <span className="block text-sm font-medium text-mute">
              Enter scores from the Players tab
            </span>
          </span>
          <span className="shrink-0 rounded-lg bg-chalk px-3 py-2 text-sm font-bold text-ink-2">
            Open
          </span>
        </Link>
      )}

      <GroupScorecard matchNo={matchNo} editable={false} />

      {!isMine && (
        <p className="mt-4 px-1 text-center text-sm font-medium text-mute">
          Playing in this group?{" "}
          <Link href="/players" className="font-semibold text-chalk underline">
            Claim it in Players
          </Link>{" "}
          to enter scores.
        </p>
      )}
    </main>
  );
}
