"use client";

import Link from "next/link";

import { MATCHES, TEAMS, type TeamId } from "@/lib/tournament";
import { TEAM_STYLE } from "@/components/ui";

const TEAM_ORDER: TeamId[] = ["badgers", "gators"];

export default function RosterPage() {
  return (
    <main>
      <header className="px-4 pt-5 pb-4">
        <h1 className="font-display text-lg leading-none font-black tracking-tight">
          Teams
        </h1>
        <p className="mt-1 text-[11px] font-semibold text-mute">
          20 a side · handicaps shown for reference only, every match is gross
        </p>
      </header>

      <div className="space-y-2 px-3">
        {MATCHES.map((match) => (
          <div
            key={match.no}
            className="rounded-2xl border border-line bg-ink-2 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-baseline gap-2">
                <span className="font-display text-[11px] font-black tracking-[0.16em] text-mute">
                  MATCH {match.no}
                </span>
                <span className="font-display text-[11px] font-black tabular text-chalk">
                  {match.teeTime}
                </span>
              </span>
              <Link
                href={`/match/${match.no}`}
                className="text-[11px] font-bold text-mute underline-offset-4 hover:text-chalk hover:underline"
              >
                Score →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {TEAM_ORDER.map((team) => (
                <div key={team}>
                  <p
                    className={`mb-1.5 text-[9px] font-black tracking-[0.14em] ${TEAM_STYLE[team].text}`}
                  >
                    {TEAMS[team].shortName.toUpperCase()}
                  </p>
                  <ul className="space-y-1">
                    {match[team].map((player) => (
                      <li
                        key={player.name}
                        className="flex items-baseline justify-between gap-2"
                      >
                        <span className="truncate text-sm font-semibold text-chalk">
                          {player.name}
                        </span>
                        <span className="shrink-0 text-[11px] font-bold tabular text-mute">
                          {player.handicap}
                        </span>
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
