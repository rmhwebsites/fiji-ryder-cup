"use client";

import Link from "next/link";

import { MATCHES, teeLabel, TEAMS, type TeamId } from "@/lib/tournament";
import { TEAM_STYLE } from "@/components/ui";

const TEAM_ORDER: TeamId[] = ["badgers", "gators"];

/** The draw — who is playing whom, group by group. */
export default function TeamsPage() {
  return (
    <main className="px-3 pb-4">
      <header className="px-1 pt-6 pb-4">
        <h1 className="font-display text-2xl leading-tight font-extrabold tracking-tight">
          Teams
        </h1>
        <p className="mt-1 text-base font-medium text-mute">
          20 a side · every match is straight gross
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {MATCHES.map((match) => (
          <div
            key={match.no}
            className="rounded-2xl border border-line bg-ink-2 p-4"
          >
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <span className="flex items-baseline gap-2.5">
                <span className="font-display text-base font-bold text-chalk">
                  Match {match.no}
                </span>
                <span className="text-sm font-semibold tabular text-mute">
                  {teeLabel(match.teeAt)}
                </span>
              </span>
              <Link
                href={`/match/${match.no}`}
                className="shrink-0 text-sm font-semibold text-mute underline-offset-4 hover:text-chalk hover:underline"
              >
                Card →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {TEAM_ORDER.map((team) => (
                <div key={team}>
                  <p
                    className={`mb-2 text-sm font-bold ${TEAM_STYLE[team].text}`}
                  >
                    {TEAMS[team].shortName}
                  </p>
                  <ul className="space-y-1.5">
                    {match[team].map((player) => (
                      <li
                        key={player.name}
                        className="truncate text-base font-medium text-chalk"
                      >
                        {player.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
