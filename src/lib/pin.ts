"use client";

/**
 * Scoring PIN.
 *
 * One shared code unlocks entry for every group — the point is to stop a
 * spectator thumbing a score in by accident, not to keep anyone out. Unlock
 * once and the phone remembers it for the rest of the day.
 *
 * Exposed as an external store so components can read it with
 * useSyncExternalStore and stay right through hydration.
 */

const STORAGE_KEY = "frc:unlocked";

export const SCORING_PIN = process.env.NEXT_PUBLIC_SCORING_PIN || "3454";

/** How many dots the gate draws, and the digit count that auto-submits. Derived
 *  from the code itself, so a longer NEXT_PUBLIC_SCORING_PIN still lines up. */
export const PIN_LENGTH = SCORING_PIN.length;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeUnlocked(listener: () => void): () => void {
  listeners.add(listener);
  // Unlocking in one tab should unlock the others.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Snapshot for useSyncExternalStore. A boolean, so it stays referentially stable. */
export function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === SCORING_PIN;
  } catch {
    return false;
  }
}

/** The server never has the code, so scoring always starts locked. */
export const isUnlockedOnServer = () => false;

export function unlock(pin: string): boolean {
  const ok = pin.trim() === SCORING_PIN;
  if (ok) {
    try {
      window.localStorage.setItem(STORAGE_KEY, SCORING_PIN);
    } catch {
      // Private browsing with storage disabled. Nothing to persist, but the
      // emit below still unlocks this session.
    }
    emit();
  }
  return ok;
}

export function lock() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
  emit();
}
