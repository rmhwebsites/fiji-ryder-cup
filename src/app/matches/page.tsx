"use client";

import { MatchCard } from "@/components/MatchCard";
import { useLive } from "@/components/TournamentProvider";
import { LiveDot, SectionTitle } from "@/components/ui";

export default function MatchesPage() {
  const { standings, connection, pending } = useLive();

  return (
    <main>
      <header className="flex items-center justify-between px-4 pt-5 pb-4">
        <div>
          <h1 className="font-display text-lg leading-none font-black tracking-tight">
            All Matches
          </h1>
          <p className="mt-1 text-[11px] font-semibold text-mute">
            Tap a group to enter scores
          </p>
        </div>
        <LiveDot connection={connection} pending={pending} />
      </header>

      <div className="px-3">
        <SectionTitle>10 GROUPS · 40 PLAYERS</SectionTitle>
        <div className="space-y-2">
          {standings.matches.map((m) => (
            <MatchCard key={m.matchNo} summary={m} />
          ))}
        </div>
      </div>
    </main>
  );
}
