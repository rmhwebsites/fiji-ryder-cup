"use client";

import { COURSE } from "@/lib/course";
import { useIdentity } from "@/lib/identity";
import { roundDateLabel } from "@/lib/tournament";
import { MatchCard } from "@/components/MatchCard";
import { ScoreBoard } from "@/components/ScoreBoard";
import { useLive } from "@/components/TournamentProvider";
import { LiveDot, SectionTitle } from "@/components/ui";

/**
 * The board. One screen: the cup score, then all ten groups.
 *
 * There used to be a separate Matches tab holding the same ten cards, which
 * meant two tabs answering the same question. The groups live here now, split
 * by what they are doing rather than by which tab you happened to open.
 */
export default function LivePage() {
  const { standings, connection, pending } = useLive();
  const me = useIdentity();

  const live = standings.matches.filter((m) => m.started && !m.complete);
  const upcoming = standings.matches.filter((m) => !m.started);
  const done = standings.matches.filter((m) => m.complete);

  const sections = [
    { key: "live", title: "On the course", matches: live },
    {
      key: "upcoming",
      title: live.length || done.length ? "Yet to tee off" : "Tee times",
      matches: upcoming,
    },
    { key: "done", title: "In the clubhouse", matches: done },
  ].filter((s) => s.matches.length > 0);

  return (
    <main>
      <header className="flex items-start justify-between gap-3 px-4 pt-6 pb-2">
        <div className="min-w-0">
          <h1 className="font-display text-2xl leading-tight font-extrabold tracking-tight">
            FIJI Ryder Cup
          </h1>
          <p className="mt-1 text-base font-medium text-mute">
            {roundDateLabel()} · {COURSE.name}
          </p>
        </div>
        <div className="pt-1">
          <LiveDot connection={connection} pending={pending} />
        </div>
      </header>

      <ScoreBoard standings={standings} />

      <div className="space-y-7 px-3 pt-6">
        {sections.map((section) => (
          <section key={section.key}>
            <SectionTitle>{section.title}</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              {section.matches.map((m) => (
                <MatchCard
                  key={m.matchNo}
                  summary={m}
                  mine={me?.matchNo === m.matchNo}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
