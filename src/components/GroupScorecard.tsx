"use client";

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
import { MatchScorecard } from "@/components/MatchScorecard";
import { useLive } from "@/components/TournamentProvider";
import { BeerChip, SegmentPill, TEAM_STYLE } from "@/components/ui";

const TEAM_ORDER: TeamId[] = ["badgers", "gators"];
const surname = (n: string) => n.split(" ").slice(-1)[0];

/**
 * One group's card, hole by hole.
 *
 * The same component serves the public board and the player entering scores —
 * `editable` is the only difference. A spectator sees exactly the card the
 * group is filling in, which is the point: the scores are never hidden behind
 * the code, only the ability to write them.
 */
export function GroupScorecard({
  matchNo,
  editable,
}: {
  matchNo: number;
  editable: boolean;
}) {
  const { standings, setScore, setBeers } = useLive();
  const { celebrateScore } = useCelebrate();

  const [hole, setHole] = useState(1);
  const holeStrip = useRef<HTMLDivElement>(null);

  // Keep the hole you are on inside the strip — otherwise the back nine sits
  // off-screen and you have to swipe to it every single time.
  useEffect(() => {
    const active = holeStrip.current?.querySelector('[aria-current="true"]');
    active?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [hole]);

  const match = getMatch(matchNo);
  const summary = standings.matches.find((m) => m.matchNo === matchNo);
  if (!match || !summary) return null;

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
    <div className="space-y-4">
      {/* Both nines at a glance */}
      <div className="flex gap-2">
        <SegmentPill status={summary.front} />
        <SegmentPill status={summary.back} />
      </div>

      {/* The whole match, every score, and who took each hole */}
      <MatchScorecard
        match={match}
        state={matchState}
        currentHole={hole}
        onPickHole={setHole}
      />

      {/* Hole picker.
          Widths are a fraction of the visible strip — five across on a phone,
          six on a laptop — so a whole number of holes always fits and none is
          ever sliced down the middle. Snap points keep it that way after a
          swipe. The selected hole is a solid fill rather than a ring, because
          a ring with an offset gets clipped by the scroll container's edge. */}
      <div
        ref={holeStrip}
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto py-1"
        role="group"
        aria-label="Pick a hole"
      >
        {Array.from({ length: 18 }, (_, i) => i + 1).map((h) => {
          const res = holeResult(matchState, h);
          const active = h === hole;
          const tone = active
            ? "bg-chalk text-ink-2 border-chalk"
            : res === "badgers"
              ? "bg-badger/20 text-badger border-badger/40"
              : res === "gators"
                ? "bg-gator/20 text-gator border-gator/40"
                : res === "halve"
                  ? "bg-line/60 text-chalk border-line"
                  : "bg-ink-2 text-mute border-line";
          return (
            <button
              key={h}
              type="button"
              onClick={() => setHole(h)}
              aria-label={`Hole ${h}, par ${parForHole(h)}`}
              aria-current={active}
              className={`h-20 w-[calc((100%-2rem)/5)] shrink-0 snap-start rounded-xl border transition-colors sm:w-[calc((100%-2.5rem)/6)] ${tone}`}
            >
              <span className="block font-display text-2xl leading-tight font-extrabold tabular">
                {h}
              </span>
              <span className="block text-sm leading-tight font-medium opacity-70">
                par {parForHole(h)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-ink-2">
        {/* Current hole */}
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <button
            type="button"
            disabled={hole === 1}
            onClick={() => setHole((h) => Math.max(1, h - 1))}
            aria-label="Previous hole"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-ink-3 text-mute active:scale-90 disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="text-center">
            <p className="font-display text-3xl leading-none font-extrabold tabular">
              Hole {hole}
            </p>
            <p className="mt-1.5 text-base font-medium text-mute">
              Par {par} · {meta.format}
            </p>
          </div>

          <button
            type="button"
            disabled={hole === 18}
            onClick={() => setHole((h) => Math.min(18, h + 1))}
            aria-label="Next hole"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-ink-3 text-mute active:scale-90 disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className="divide-y divide-line">
          {TEAM_ORDER.map((team) => (
            <div key={team} className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-base font-bold ${TEAM_STYLE[team].text}`}>
                  {TEAMS[team].name}
                </p>
                <p className="font-display text-lg font-bold tabular text-mute">
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
                      onChange={
                        editable
                          ? (strokes) => handleScore(team, slot, strokes)
                          : undefined
                      }
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
                  onChange={
                    editable
                      ? (strokes) => handleScore(team, 0, strokes)
                      : undefined
                  }
                />
              )}
            </div>
          ))}

          {/* Hole result */}
          <div className="px-4 py-4 text-center">
            <p className="text-base font-semibold text-mute">
              {result === null
                ? "Both sides need a score"
                : result === "halve"
                  ? "Hole halved"
                  : `${TEAMS[result].name} win the hole`}
            </p>
          </div>

          {/* Beers */}
          <div className="px-4 py-4">
            <p className="mb-2.5 text-base font-bold text-chalk">
              Beers on this hole
            </p>
            {editable ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {TEAM_ORDER.map((team) => (
                    <BeerCounter
                      key={team}
                      label={TEAMS[team].shortName}
                      accent={TEAM_STYLE[team].text}
                      holeCount={holeBeers(matchState, team, hole)}
                      total={summary.beers[team].total}
                      onChange={(next) => setBeers(matchNo, hole, team, next)}
                    />
                  ))}
                </div>
                <div className="mt-3 flex justify-between gap-2">
                  {TEAM_ORDER.map((team) => (
                    <BeerChip key={team} status={summary.beers[team]} />
                  ))}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {TEAM_ORDER.map((team) => (
                  <div
                    key={team}
                    className="rounded-xl border border-line bg-ink-3/50 p-3"
                  >
                    <p
                      className={`mb-1.5 text-sm font-bold ${TEAM_STYLE[team].text}`}
                    >
                      {TEAMS[team].shortName}
                    </p>
                    <p className="font-display text-xl font-extrabold tabular text-chalk">
                      {holeBeers(matchState, team, hole)}
                      <span className="ml-1.5 text-sm font-medium text-mute">
                        this hole
                      </span>
                    </p>
                    <div className="mt-2">
                      <BeerChip status={summary.beers[team]} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
