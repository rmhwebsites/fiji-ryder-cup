"use client";

/**
 * Who is holding this phone.
 *
 * A player unlocks with the scoring code once, claims their group once, and the
 * phone remembers both for the rest of the day. That claim is what turns the
 * read-only board into a scorecard they can actually write on.
 *
 * This is not authentication. It is the same idea as the code itself — enough
 * structure that four people in a group are writing on the right card, and that
 * a spectator scrolling the board cannot type over it.
 */

import { useSyncExternalStore } from "react";

import { getMatch, TEAM_IDS, type TeamId } from "./tournament";

const STORAGE_KEY = "frc:me";

export interface Identity {
  /** The group they are playing in, 1-10. */
  matchNo: number;
  /** Their side of that group. */
  team: TeamId;
}

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeIdentity(listener: () => void): () => void {
  listeners.add(listener);
  // Claiming in one tab should settle the others.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function parse(raw: string | null): Identity | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Identity>;
    if (typeof value.matchNo !== "number" || typeof value.team !== "string") {
      return null;
    }
    // A claim against a draw that has since been renumbered is not a claim.
    if (!getMatch(value.matchNo)) return null;
    if (!TEAM_IDS.includes(value.team as TeamId)) return null;
    return { matchNo: value.matchNo, team: value.team as TeamId };
  } catch {
    return null;
  }
}

// useSyncExternalStore compares snapshots by identity, so parsing on every read
// would hand React a brand new object each time and spin forever. Cache against
// the raw string and only rebuild when the stored text actually changes.
let cachedRaw: string | null = null;
let cached: Identity | null = null;

export function getIdentity(): Identity | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = parse(raw);
  }
  return cached;
}

/** The server has no phone to ask, so nobody is claimed during the static render. */
export const getIdentityOnServer = (): Identity | null => null;

export function claim(matchNo: number, team: TeamId) {
  const next: Identity = { matchNo, team };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing. The emit below still updates this session.
  }
  emit();
}

export function release() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
  emit();
}

/**
 * Can this phone write to that group's card?
 *
 * A claim covers the whole group, both pairings — one person keeping the card
 * for all four is how it actually works out there, and a hole should never
 * stall because the other pair has their phone in the cart.
 */
export function canScore(me: Identity | null, matchNo: number): boolean {
  return me !== null && me.matchNo === matchNo;
}

/** The claim on this phone, or null if nobody has made one. */
export function useIdentity(): Identity | null {
  return useSyncExternalStore(
    subscribeIdentity,
    getIdentity,
    getIdentityOnServer,
  );
}
