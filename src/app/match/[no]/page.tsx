"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  parForHole,
  SEGMENT_META,
  scoreName,
  segmentForHole,
  type Segment,
} from "@/lib/course";
import {
  holeBeers,
  holeResult,
  playerScore,
  teamHoleScore,
} from "@/lib/scoring";
import { getMatch, TEAMS, type TeamId } from "@/lib/tournament";
import { useCelebrate } from "@/components/Celebrations";
import { BeerCounter, ScoreStepper } from "@/components/HoleEntry";
import { TeeTimeBar } from "@/components/MatchCard";
import { PinPrompt, usePinGate } from "@/components/PinGate";
import { useLive } from "@/components/TournamentProvider";
import { BeerChip, SegmentPill, TEAM_STYLE } from "@/components/ui";

const TEAM_ORDER: TeamId[] = ["badgers", "gators"];
const surname = (n: string) => n.split(" ").slice(-1)[0];

export default function MatchPage() {
  const params = useParams<{ no: string }>();
  const router = useRouter();
  const matchNo = Number(params.no);

  const { standings, setScore, setBeers } = useLive();
  const unlocked = usePinGate();
  const { celebrateScore } = useCelebrate();

  const [hole, setHole] = useState(1);
  const holeStrip = useRef<HTMLDivElement>(null);

  // Keep the hole you are on inside the strip — otherwise the back nine sits
  // off-screen and you have to swipe to it every single time.
  useEffect(() => {
    const active = holeStrip.current?.querySelector('[aria-current="true"]');
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [hole]);

  const match = getMatch(matchNo);
  const summary = standings.matches.find((m) => m.matchNo === matchNo);

  if (!match || !summary || Number.isNaN(matchNo)) {
    return (
      <main className="px-4 pt-16 text-center">
        <p className="font-display text-lg font-black">No such match</p>
        <Link href="/" className="mt-3 inline-block text-sm font-bold text-mute underline">
          Back to the leaderboard
        </Link>
      </main>
    );
  }

  const segment: Segment = segmentForHole(hole);
  const meta = SEGMENT_META[segment];
  const matchState = summary.raw;
  const par = parForHole(hole);
  const result = holeResult(matchState, hole);

  const handleScore = (team: TeamId, slot: number, strokes: number) => {
    setScore(matchNo, hole, team, slot, strokes);
    const name = scoreName(strokes, hole);
    const who =
      slot === 0
        ? `${TEAMS[team].shortName} · ${surname(match[team][0].name)} / ${surname(match[team][1].name)}`
        : match[team][slot - 1].name;
    celebrateScore(name, who, team, hole);
  };

  return (
    <main className="pb-4">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="Back"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-ink-2 text-mute active:scale-90"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg leading-none font-black tracking-tight">
            Match {matchNo}
          </h1>
          <p className="mt-1 truncate text-[11px] font-semibold text-mute">
            {surname(match.badgers[0].name)} / {surname(match.badgers[1].name)}
            {" vs "}
            {surname(match.gators[0].name)} / {surname(match.gators[1].name)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[9px] font-black tracking-[0.14em] text-mute">
            TEE
          </p>
          <p className="font-display text-sm font-black tabular text-chalk">
            {match.teeTime}
          </p>
        </div>
      </header>

      {/* Both nines at a glance, once there is a score to show */}
      <div className="px-3 pb-3">
        {summary.started ? (
          <div className="flex gap-2">
            <SegmentPill status={summary.front} />
            <SegmentPill status={summary.back} />
          </div>
        ) : (
          <TeeTimeBar teeTime={match.teeTime} />
        )}
      </div>

      {/* Hole strip */}
      <div className="px-3 pb-3">
        <div ref={holeStrip} className="flex gap-1 overflow-x-auto pb-1">
          {Array.from({ length: 18 }, (_, i) => i + 1).map((h) => {
            const res = holeResult(matchState, h);
            const active = h === hole;
            const tone =
              res === "badgers"
                ? "bg-badger/25 text-badger border-badger/40"
                : res === "gators"
                  ? "bg-gator/25 text-gator border-gator/40"
                  : res === "halve"
                    ? "bg-line/60 text-chalk border-line"
                    : "bg-ink-2 text-mute border-line";
            return (
              <button
                key={h}
                type="button"
                onClick={() => setHole(h)}
                aria-label={`Hole ${h}`}
                aria-current={active}
                className={`shrink-0 rounded-lg border px-0 py-1 text-center transition-all ${tone} ${
                  active ? "ring-2 ring-chalk ring-offset-2 ring-offset-ink" : ""
                }`}
                style={{ width: 34 }}
              >
                <span className="block text-[11px] leading-tight font-black tabular">
                  {h}
                </span>
                <span className="block text-[8px] leading-tight font-bold opacity-60">
                  {parForHole(h)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current hole */}
      <section className="px-3">
        <div className="overflow-hidden rounded-2xl border border-line bg-ink-2">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <button
              type="button"
              disabled={hole === 1}
              onClick={() => setHole((h) => Math.max(1, h - 1))}
              aria-label="Previous hole"
              className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-ink-3 text-mute active:scale-90 disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <div className="text-center">
              <p className="font-display text-2xl leading-none font-black tabular">
                HOLE {hole}
              </p>
              <p className="mt-1 text-[10px] font-black tracking-[0.16em] text-mute">
                PAR {par} · {meta.format.toUpperCase()}
              </p>
            </div>

            <button
              type="button"
              disabled={hole === 18}
              onClick={() => setHole((h) => Math.min(18, h + 1))}
              aria-label="Next hole"
              className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-ink-3 text-mute active:scale-90 disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {!unlocked ? (
            <div className="p-3">
              <PinPrompt />
            </div>
          ) : (
            <div className="divide-y divide-line">
              {TEAM_ORDER.map((team) => (
                <div key={team} className="px-4 py-2">
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p
                      className={`text-[10px] font-black tracking-[0.16em] ${TEAM_STYLE[team].text}`}
                    >
                      {TEAMS[team].name.toUpperCase()}
                    </p>
                    <p className="font-display text-sm font-black tabular text-mute">
                      {teamHoleScore(matchState, team, hole) ?? "–"}
                    </p>
                  </div>

                  {segment === "front" ? (
                    <div className="divide-y divide-line/60">
                      {[1, 2].map((slot) => (
                        <ScoreStepper
                          key={slot}
                          hole={hole}
                          label={match[team][slot - 1].name}
                          accent="text-chalk"
                          value={playerScore(matchState, team, hole, slot)}
                          onChange={(strokes) => handleScore(team, slot, strokes)}
                        />
                      ))}
                    </div>
                  ) : (
                    <ScoreStepper
                      hole={hole}
                      label="Scramble score"
                      sublabel={`${surname(match[team][0].name)} / ${surname(match[team][1].name)}`}
                      accent="text-chalk"
                      value={playerScore(matchState, team, hole, 0)}
                      onChange={(strokes) => handleScore(team, 0, strokes)}
                    />
                  )}
                </div>
              ))}

              {/* Hole result */}
              <div className="px-4 py-3 text-center">
                <p className="text-[10px] font-black tracking-[0.16em] text-mute">
                  {result === null
                    ? "BOTH SIDES NEED A SCORE"
                    : result === "halve"
                      ? "HOLE HALVED"
                      : `${TEAMS[result].name.toUpperCase()} WIN THE HOLE`}
                </p>
              </div>

              {/* Beers */}
              <div className="px-4 py-3">
                <p className="mb-2 text-[10px] font-black tracking-[0.16em] text-mute">
                  BEERS ON THIS HOLE
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {TEAM_ORDER.map((team) => (
                    <BeerCounter
                      key={team}
                      label={TEAMS[team].shortName.toUpperCase()}
                      accent={TEAM_STYLE[team].text}
                      holeCount={holeBeers(matchState, team, hole)}
                      total={summary.beers[team].total}
                      onChange={(next) => setBeers(matchNo, hole, team, next)}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between gap-2">
                  {TEAM_ORDER.map((team) => (
                    <BeerChip key={team} status={summary.beers[team]} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
