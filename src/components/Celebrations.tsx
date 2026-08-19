"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { SCORE_LABELS, type ScoreName } from "@/lib/course";
import type { Standings } from "@/lib/scoring";
import { TEAMS, type TeamId } from "@/lib/tournament";

/* ── Types ─────────────────────────────────────────────────────────────── */

interface ScoreCelebration {
  id: number;
  kind: "score";
  name: Extract<ScoreName, "birdie" | "eagle" | "albatross">;
  who: string;
  team: TeamId;
  hole: number;
}

interface PointCelebration {
  id: number;
  kind: "point";
  matchNo: number;
  segment: "front" | "back";
  headline: string;
  detail: string;
  /** Null when the nine was halved and both teams took a half. */
  team: TeamId | null;
  halved: boolean;
}

type Celebration = ScoreCelebration | PointCelebration;

/** A celebration before it gets an id. Omit over a union has to distribute. */
type NewCelebration =
  | Omit<ScoreCelebration, "id">
  | Omit<PointCelebration, "id">;

interface CelebrationApi {
  celebrateScore: (
    name: ScoreName,
    who: string,
    team: TeamId,
    hole: number,
  ) => void;
}

/**
 * Seeded PRNG (mulberry32). Confetti needs to look scattered but must not be
 * re-rolled on every render, so each burst derives its layout from its id.
 */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** How long a score must hold still before it is worth celebrating. */
const SETTLE_MS = 700;

const Ctx = createContext<CelebrationApi>({ celebrateScore: () => {} });

export const useCelebrate = () => useContext(Ctx);

/* ── Confetti ──────────────────────────────────────────────────────────── */

const CONFETTI_COLORS: Record<"badgers" | "gators" | "mixed", string[]> = {
  badgers: ["#f0a92b", "#ffc861", "#fff0cf", "#b87d12"],
  gators: ["#16b46b", "#3ee89a", "#d6ffe9", "#0d7a48"],
  mixed: ["#f0a92b", "#16b46b", "#ffc861", "#3ee89a", "#f4f7fb"],
};

function Confetti({
  palette,
  seed,
  count = 44,
}: {
  palette: keyof typeof CONFETTI_COLORS;
  seed: number;
  count?: number;
}) {
  // Generated once per burst so a re-render doesn't reshuffle mid-fall.
  const pieces = useMemo(() => {
    const rand = seeded(seed);
    return Array.from({ length: count }, (_, i) => ({
      left: rand() * 100,
      delay: rand() * 400,
      duration: 1500 + rand() * 1400,
      drift: `${(rand() - 0.5) * 220}px`,
      spin: `${540 + rand() * 900}deg`,
      color: CONFETTI_COLORS[palette][i % CONFETTI_COLORS[palette].length],
      width: 6 + rand() * 7,
      height: 9 + rand() * 12,
      round: rand() > 0.7,
    }));
  }, [palette, count, seed]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: p.width,
            height: p.height,
            background: p.color,
            borderRadius: p.round ? "50%" : 2,
            ["--drift" as string]: p.drift,
            ["--spin" as string]: p.spin,
            animation: `confetti-fall ${p.duration}ms cubic-bezier(0.25, 0.6, 0.45, 1) ${p.delay}ms both`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Birdie / eagle burst ──────────────────────────────────────────────── */

const SCORE_STYLE: Record<
  ScoreCelebration["name"],
  { ring: string; text: string; glow: string; confetti: number }
> = {
  birdie: {
    ring: "border-sky-300",
    text: "text-sky-200",
    glow: "shadow-[0_0_60px_rgba(125,211,252,0.55)]",
    confetti: 0,
  },
  eagle: {
    ring: "border-amber-300",
    text: "text-amber-200",
    glow: "shadow-[0_0_80px_rgba(252,211,77,0.7)]",
    confetti: 36,
  },
  albatross: {
    ring: "border-fuchsia-300",
    text: "text-fuchsia-200",
    glow: "shadow-[0_0_100px_rgba(240,171,252,0.8)]",
    confetti: 60,
  },
};

function ScoreBurst({ c }: { c: ScoreCelebration }) {
  const style = SCORE_STYLE[c.name];
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] grid place-items-center">
      {style.confetti > 0 && (
        <Confetti
          palette={c.team === "badgers" ? "badgers" : "gators"}
          seed={c.id}
          count={style.confetti}
        />
      )}
      <div className="relative grid place-items-center">
        <span
          className={`anim-ring absolute h-32 w-32 rounded-full border-4 ${style.ring}`}
        />
        <span
          className={`anim-ring absolute h-32 w-32 rounded-full border-4 ${style.ring}`}
          style={{ animationDelay: "160ms" }}
        />
        <div
          className={`anim-pop relative rounded-2xl border border-white/15 bg-ink-2/95 px-7 py-5 text-center backdrop-blur ${style.glow}`}
        >
          <p
            className={`font-display text-4xl font-black tracking-tight ${style.text}`}
          >
            {SCORE_LABELS[c.name]}
          </p>
          <p className="mt-1 text-sm font-semibold text-chalk">{c.who}</p>
          <p className="text-xs font-medium tracking-wide text-mute">
            Hole {c.hole}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Point secured banner ──────────────────────────────────────────────── */

function PointBanner({ c }: { c: PointCelebration }) {
  const accent = c.halved
    ? "from-badger via-chalk to-gator"
    : c.team === "badgers"
      ? "from-badger-dim via-badger to-badger-glow"
      : "from-gator-dim via-gator to-gator-glow";

  return (
    <>
      <Confetti
        palette={c.halved ? "mixed" : c.team === "badgers" ? "badgers" : "gators"}
        seed={c.id}
        count={c.halved ? 50 : 56}
      />
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] px-3 pt-3">
        <div className="anim-banner mx-auto max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-ink-2/95 shadow-2xl backdrop-blur">
          <div className={`h-1.5 w-full bg-gradient-to-r ${accent}`} />
          <div className="flex items-center gap-3 px-4 py-3">
            <div
              className={`anim-pop grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${accent} font-display text-lg font-black text-ink`}
            >
              {c.halved ? "½" : "1"}
            </div>
            <div className="min-w-0">
              <p className="font-display text-base leading-tight font-black tracking-tight">
                {c.headline}
              </p>
              <p className="truncate text-xs font-medium text-mute">{c.detail}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Provider ──────────────────────────────────────────────────────────── */

/**
 * Drives every celebration in the app.
 *
 * Birdies and eagles are fired explicitly from the score entry screen. Points
 * are detected by diffing the standings, so a nine closing out lights up every
 * phone watching the leaderboard, not just the group that entered the score.
 */
export function CelebrationProvider({
  standings,
  ready,
  children,
}: {
  standings: Standings;
  ready: boolean;
  children: ReactNode;
}) {
  const [queue, setQueue] = useState<Celebration[]>([]);
  const nextId = useRef(1);
  const scoreTimers = useRef(new Map<string, number>());

  // Nines already finished when this phone joined. Seeded on first paint so
  // opening the app at the turn doesn't fire twenty banners at once.
  const seen = useRef<Set<string> | null>(null);

  const push = useCallback((c: NewCelebration) => {
    const id = nextId.current++;
    setQueue((q) => [...q, { ...c, id } as Celebration]);
    window.setTimeout(() => {
      setQueue((q) => q.filter((item) => item.id !== id));
    }, c.kind === "point" ? 3600 : 1500);
  }, []);

  const celebrateScore = useCallback(
    (name: ScoreName, who: string, team: TeamId, hole: number) => {
      // Scores are dialled in a tap at a time, so 5 -> 4 -> 3 on a par 5 passes
      // through birdie on its way to eagle. Wait for the number to settle and
      // only celebrate where it lands — the last word for a player on a hole
      // always replaces the one before it.
      const key = `${team}:${who}:${hole}`;
      const timers = scoreTimers.current;

      const queued = timers.get(key);
      if (queued !== undefined) {
        window.clearTimeout(queued);
        timers.delete(key);
      }

      if (name !== "birdie" && name !== "eagle" && name !== "albatross") return;

      timers.set(
        key,
        window.setTimeout(() => {
          timers.delete(key);
          push({ kind: "score", name, who, team, hole });
        }, SETTLE_MS),
      );
    },
    [push],
  );

  // Drop any celebration still waiting to fire when the screen goes away.
  useEffect(() => {
    const timers = scoreTimers.current;
    return () => {
      for (const id of timers.values()) window.clearTimeout(id);
      timers.clear();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    const finished = new Set<string>();
    for (const match of standings.matches) {
      for (const status of [match.front, match.back] as const) {
        if (status.finished) finished.add(`${match.matchNo}:${status.segment}`);
      }
    }

    if (seen.current === null) {
      seen.current = finished;
      return;
    }

    for (const match of standings.matches) {
      for (const status of [match.front, match.back] as const) {
        const key = `${match.matchNo}:${status.segment}`;
        if (!status.finished || seen.current.has(key)) continue;

        const nine = status.segment === "front" ? "Front 9" : "Back 9";
        const format = status.segment === "front" ? "Best Ball" : "Scramble";

        push(
          status.leader === null
            ? {
                kind: "point",
                matchNo: match.matchNo,
                segment: status.segment,
                team: null,
                halved: true,
                headline: `Match ${match.matchNo} halved`,
                detail: `${nine} · ${format} · half a point each`,
              }
            : {
                kind: "point",
                matchNo: match.matchNo,
                segment: status.segment,
                team: status.leader,
                halved: false,
                headline: `${TEAMS[status.leader].name} win ${status.result}`,
                detail: `Match ${match.matchNo} · ${nine} · ${format} · +1 point`,
              },
        );
      }
    }

    seen.current = finished;
  }, [standings, ready, push]);

  const api = useMemo(() => ({ celebrateScore }), [celebrateScore]);

  // Newest wins — an eagle landing on top of a birdie should show the eagle.
  const banner = queue.findLast(
    (c): c is PointCelebration => c.kind === "point",
  );
  const burst = queue.findLast((c): c is ScoreCelebration => c.kind === "score");

  return (
    <Ctx.Provider value={api}>
      {children}
      {burst && <ScoreBurst key={burst.id} c={burst} />}
      {banner && <PointBanner key={banner.id} c={banner} />}
    </Ctx.Provider>
  );
}
