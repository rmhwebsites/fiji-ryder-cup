"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getSupabase, isSupabaseConfigured } from "./supabase";
import {
  buildMatchStates,
  computeStandings,
  type BeerRow,
  type ScoreRow,
  type Standings,
} from "./scoring";
import type { TeamId } from "./tournament";

export type Connection = "connecting" | "live" | "offline" | "local";

const SCORE_CACHE = "frc:scores";
const BEER_CACHE = "frc:beers";
const QUEUE_CACHE = "frc:queue";

const scoreId = (r: { matchNo: number; hole: number; team: TeamId; slot: number }) =>
  `${r.matchNo}:${r.hole}:${r.team}:${r.slot}`;
const beerId = (r: { matchNo: number; hole: number; team: TeamId }) =>
  `${r.matchNo}:${r.hole}:${r.team}`;

type QueuedWrite =
  | { kind: "score"; row: ScoreRow }
  | { kind: "beer"; row: BeerRow };

function readCache<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeCache<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked. The in-memory copy still drives the UI and the
    // server copy is the source of truth, so this is safe to swallow.
  }
}

export interface Tournament {
  standings: Standings;
  connection: Connection;
  /** Writes still waiting on a signal. */
  pending: number;
  ready: boolean;
  setScore: (
    matchNo: number,
    hole: number,
    team: TeamId,
    slot: number,
    strokes: number,
  ) => void;
  setBeers: (
    matchNo: number,
    hole: number,
    team: TeamId,
    beers: number,
  ) => void;
}

/**
 * Live tournament state.
 *
 * Every write lands in local state immediately and is pushed to Supabase in
 * the background. If the push fails — and it will, somewhere out on the back
 * nine — it goes into a queue that survives a refresh and drains as soon as
 * the phone finds signal again. Nobody has to think about it.
 */
export function useTournament(): Tournament {
  const [scores, setScores] = useState<Map<string, ScoreRow>>(new Map());
  const [beers, setBeers] = useState<Map<string, BeerRow>>(new Map());
  const [connection, setConnection] = useState<Connection>(
    isSupabaseConfigured ? "connecting" : "local",
  );
  const [pending, setPending] = useState(0);
  const [ready, setReady] = useState(false);

  const queue = useRef<QueuedWrite[]>([]);
  const flushing = useRef(false);

  // Hydrate from the last known good state so the board is populated before
  // the network answers — and so a dead zone still shows the current match.
  //
  // This has to happen after mount: localStorage does not exist during the
  // static render, and seeding it during render would desync hydration. One
  // pass, once, on a cache that is at most a few hundred rows.
  useEffect(() => {
    const cachedScores = readCache<ScoreRow>(SCORE_CACHE);
    const cachedBeers = readCache<BeerRow>(BEER_CACHE);
    queue.current = readCache<QueuedWrite>(QUEUE_CACHE);

    /* eslint-disable react-hooks/set-state-in-effect */
    if (cachedScores.length) {
      setScores(new Map(cachedScores.map((r) => [scoreId(r), r])));
    }
    if (cachedBeers.length) {
      setBeers(new Map(cachedBeers.map((r) => [beerId(r), r])));
    }
    setPending(queue.current.length);
    if (!isSupabaseConfigured) setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const persistQueue = useCallback(() => {
    writeCache(QUEUE_CACHE, queue.current);
    setPending(queue.current.length);
  }, []);

  const flush = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || flushing.current || queue.current.length === 0) return;

    flushing.current = true;
    try {
      while (queue.current.length > 0) {
        const write = queue.current[0];
        const { error } =
          write.kind === "score"
            ? await supabase.from("scores").upsert(
                {
                  match_no: write.row.matchNo,
                  hole: write.row.hole,
                  team: write.row.team,
                  slot: write.row.slot,
                  strokes: write.row.strokes,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "match_no,hole,team,slot" },
              )
            : await supabase.from("beers").upsert(
                {
                  match_no: write.row.matchNo,
                  hole: write.row.hole,
                  team: write.row.team,
                  beers: write.row.beers,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "match_no,hole,team" },
              );

        if (error) {
          setConnection("offline");
          break;
        }
        queue.current.shift();
        persistQueue();
        setConnection("live");
      }
    } finally {
      flushing.current = false;
    }
  }, [persistQueue]);

  // Initial load plus the realtime subscription that keeps all 40 phones in sync.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    let cancelled = false;

    const load = async () => {
      const [scoreRes, beerRes] = await Promise.all([
        supabase.from("scores").select("match_no,hole,team,slot,strokes"),
        supabase.from("beers").select("match_no,hole,team,beers"),
      ]);
      if (cancelled) return;

      if (scoreRes.error || beerRes.error) {
        setConnection("offline");
        setReady(true);
        return;
      }

      const nextScores = new Map<string, ScoreRow>();
      for (const r of scoreRes.data ?? []) {
        const row: ScoreRow = {
          matchNo: r.match_no,
          hole: r.hole,
          team: r.team as TeamId,
          slot: r.slot,
          strokes: r.strokes,
        };
        nextScores.set(scoreId(row), row);
      }

      const nextBeers = new Map<string, BeerRow>();
      for (const r of beerRes.data ?? []) {
        const row: BeerRow = {
          matchNo: r.match_no,
          hole: r.hole,
          team: r.team as TeamId,
          beers: r.beers,
        };
        nextBeers.set(beerId(row), row);
      }

      setScores(nextScores);
      setBeers(nextBeers);
      writeCache(SCORE_CACHE, [...nextScores.values()]);
      writeCache(BEER_CACHE, [...nextBeers.values()]);
      setConnection("live");
      setReady(true);
      void flush();
    };

    void load();

    const channel = supabase
      .channel("frc-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scores" },
        (payload) => {
          const r = payload.new as Record<string, number | string> | null;
          if (!r || payload.eventType === "DELETE") return;
          const row: ScoreRow = {
            matchNo: r.match_no as number,
            hole: r.hole as number,
            team: r.team as TeamId,
            slot: r.slot as number,
            strokes: r.strokes as number,
          };
          setScores((prev) => {
            const next = new Map(prev).set(scoreId(row), row);
            writeCache(SCORE_CACHE, [...next.values()]);
            return next;
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "beers" },
        (payload) => {
          const r = payload.new as Record<string, number | string> | null;
          if (!r || payload.eventType === "DELETE") return;
          const row: BeerRow = {
            matchNo: r.match_no as number,
            hole: r.hole as number,
            team: r.team as TeamId,
            beers: r.beers as number,
          };
          setBeers((prev) => {
            const next = new Map(prev).set(beerId(row), row);
            writeCache(BEER_CACHE, [...next.values()]);
            return next;
          });
        },
      )
      .subscribe((status) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") {
          setConnection("live");
          void flush();
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setConnection("offline");
        }
      });

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [flush]);

  // Retry whenever the phone comes back to life.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const retry = () => void flush();
    window.addEventListener("online", retry);
    const timer = window.setInterval(retry, 10_000);
    return () => {
      window.removeEventListener("online", retry);
      window.clearInterval(timer);
    };
  }, [flush]);

  const setScore = useCallback(
    (
      matchNo: number,
      hole: number,
      team: TeamId,
      slot: number,
      strokes: number,
    ) => {
      const row: ScoreRow = { matchNo, hole, team, slot, strokes };
      setScores((prev) => {
        const next = new Map(prev).set(scoreId(row), row);
        writeCache(SCORE_CACHE, [...next.values()]);
        return next;
      });
      if (isSupabaseConfigured) {
        queue.current = [
          ...queue.current.filter(
            (w) => !(w.kind === "score" && scoreId(w.row) === scoreId(row)),
          ),
          { kind: "score", row },
        ];
        persistQueue();
        void flush();
      }
    },
    [flush, persistQueue],
  );

  const setBeerCount = useCallback(
    (matchNo: number, hole: number, team: TeamId, count: number) => {
      const row: BeerRow = { matchNo, hole, team, beers: Math.max(0, count) };
      setBeers((prev) => {
        const next = new Map(prev).set(beerId(row), row);
        writeCache(BEER_CACHE, [...next.values()]);
        return next;
      });
      if (isSupabaseConfigured) {
        queue.current = [
          ...queue.current.filter(
            (w) => !(w.kind === "beer" && beerId(w.row) === beerId(row)),
          ),
          { kind: "beer", row },
        ];
        persistQueue();
        void flush();
      }
    },
    [flush, persistQueue],
  );

  const standings = useMemo(
    () => computeStandings(buildMatchStates([...scores.values()], [...beers.values()])),
    [scores, beers],
  );

  return {
    standings,
    connection,
    pending,
    ready,
    setScore,
    setBeers: setBeerCount,
  };
}
