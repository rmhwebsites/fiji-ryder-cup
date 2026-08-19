"use client";

import { COURSE } from "@/lib/course";
import { MatchCard } from "@/components/MatchCard";
import { ScoreBoard } from "@/components/ScoreBoard";
import { useLive } from "@/components/TournamentProvider";
import { LiveDot, SectionTitle } from "@/components/ui";

export default function HomePage() {
  const { standings, connection, pending } = useLive();

  const live = standings.matches.filter((m) => m.started && !m.complete);
  const upcoming = standings.matches.filter((m) => !m.started);
  const done = standings.matches.filter((m) => m.complete);

  return (
    <main>
      <header className="flex items-center justify-between px-4 pt-5 pb-1">
        <div>
          <h1 className="font-display text-lg leading-none font-black tracking-tight">
            FIJI RYDER CUP
          </h1>
          <p className="mt-1 text-[11px] font-semibold text-mute">
            {COURSE.name} · {COURSE.city}
          </p>
        </div>
        <LiveDot connection={connection} pending={pending} />
      </header>

      <ScoreBoard standings={standings} />

      <div className="space-y-5 px-3 pt-5">
        {live.length > 0 && (
          <section>
            <SectionTitle>ON THE COURSE</SectionTitle>
            <div className="space-y-2">
              {live.map((m) => (
                <MatchCard key={m.matchNo} summary={m} />
              ))}
            </div>
          </section>
        )}

        {upcoming.length > 0 && (
          <section>
            <SectionTitle>
              {live.length || done.length ? "YET TO TEE OFF" : "TEE TIMES"}
            </SectionTitle>
            <div className="space-y-2">
              {upcoming.map((m) => (
                <MatchCard key={m.matchNo} summary={m} />
              ))}
            </div>
          </section>
        )}

        {done.length > 0 && (
          <section>
            <SectionTitle>IN THE CLUBHOUSE</SectionTitle>
            <div className="space-y-2">
              {done.map((m) => (
                <MatchCard key={m.matchNo} summary={m} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
