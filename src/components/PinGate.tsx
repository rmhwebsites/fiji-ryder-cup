"use client";

import { useState, useSyncExternalStore } from "react";

import { isUnlocked, isUnlockedOnServer, subscribeUnlocked, unlock } from "@/lib/pin";

/**
 * One shared code unlocks scoring on this phone, once, for the whole day.
 * It exists to stop a spectator thumbing a number into someone else's card —
 * not to keep anyone out.
 */
export function usePinGate(): boolean {
  return useSyncExternalStore(
    subscribeUnlocked,
    isUnlocked,
    isUnlockedOnServer,
  );
}

export function PinPrompt() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlock(pin)) {
      setError(true);
      setPin("");
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-line bg-ink-2 p-4 text-center"
    >
      <p className="font-display text-sm font-black tracking-tight">
        Enter the scoring code
      </p>
      <p className="mt-1 text-xs font-medium text-mute">
        One code for everyone. You only do this once.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError(false);
          }}
          inputMode="numeric"
          autoComplete="off"
          placeholder="••••"
          aria-label="Scoring code"
          className={`w-full rounded-xl border bg-ink px-4 py-3 text-center font-display text-xl font-black tracking-[0.4em] tabular outline-none ${
            error ? "border-flag text-flag" : "border-line text-chalk"
          }`}
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-chalk px-5 font-display text-sm font-black text-ink active:scale-95"
        >
          Go
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs font-bold text-flag">
          Not the code — ask whoever set this up.
        </p>
      )}
    </form>
  );
}
