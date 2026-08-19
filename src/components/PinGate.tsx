"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSyncExternalStore } from "react";

import {
  PIN_LENGTH,
  isUnlocked,
  isUnlockedOnServer,
  subscribeUnlocked,
  unlock,
} from "@/lib/pin";

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

/** The iPhone keypad. 1 and 0 carry no letters, but still reserve the row so
 *  every digit sits on the same baseline. */
const KEYS: readonly { digit: string; letters?: string }[] = [
  { digit: "1" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
];

/** Android and desktop Chrome buzz. iOS Safari has no Vibration API, so on the
 *  phones this app actually ships to it is a silent no-op — the shake carries
 *  the failure on its own. */
function buzz() {
  try {
    navigator.vibrate?.([12, 70, 12]);
  } catch {
    // Vibration blocked or unsupported. Nothing to fall back to.
  }
}

export function PinPrompt() {
  // The ref is the authoritative code, the state is only what gets painted.
  // Two digits landing in the same frame — fast typing, or two fingers on the
  // glass — would both read the same stale `pin` from a closure and one would
  // be dropped. A ref mutates synchronously, so presses always accumulate.
  const pinRef = useRef("");
  const shakingRef = useRef(false);

  const [pin, setPin] = useState("");
  const [shaking, setShaking] = useState(false);
  // The shake lasts half a second; the message it leaves behind stays until
  // the next digit, so someone who fat-fingered it still sees why.
  const [failed, setFailed] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  // A rejected code is still on screen while it shakes, so the clear is on a
  // timer. Drop it if the gate unmounts mid-shake.
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const press = useCallback((digit: string) => {
    // Taps during the shake belong to the code that just failed.
    if (shakingRef.current || pinRef.current.length >= PIN_LENGTH) return;

    const next = pinRef.current + digit;
    pinRef.current = next;
    setPin(next);
    setFailed(false);
    if (next.length < PIN_LENGTH) return;

    // The last digit submits itself — there is no Go button on a lock screen.
    if (unlock(next)) return; // Correct: the gate opens and this unmounts.

    shakingRef.current = true;
    setShaking(true);
    setFailed(true);
    buzz();
    timer.current = window.setTimeout(() => {
      pinRef.current = "";
      shakingRef.current = false;
      setPin("");
      setShaking(false);
    }, 520);
  }, []);

  const back = useCallback(() => {
    if (shakingRef.current) return;
    pinRef.current = pinRef.current.slice(0, -1);
    setPin(pinRef.current);
  }, []);

  // A hardware keyboard should work too — handy on the laptop running the board.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press, back]);

  return (
    <div className="rounded-2xl border border-line bg-ink-2 px-4 pb-5 pt-6 text-center">
      <p className="font-display text-base font-black tracking-tight">
        Enter Scoring Code
      </p>

      {/* The dots double as the error message, the way the lock screen does. */}
      <p
        role="status"
        className={`mt-1 text-xs font-medium ${failed ? "font-bold text-flag" : "text-mute"}`}
      >
        {failed
          ? "Not the code — ask whoever set this up."
          : "One code for everyone. You only do this once."}
      </p>

      <div
        className={`mt-5 flex justify-center gap-5 ${shaking ? "anim-shake" : ""}`}
        aria-label={`${pin.length} of ${PIN_LENGTH} digits entered`}
        role="img"
      >
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span
            key={i}
            className={`h-3.5 w-3.5 rounded-full border-[1.5px] transition-colors duration-150 ${
              shaking
                ? "border-flag bg-flag"
                : i < pin.length
                  ? "border-chalk bg-chalk"
                  : "border-chalk/30 bg-transparent"
            }`}
          />
        ))}
      </div>

      <div className="mx-auto mt-6 grid w-fit grid-cols-3 gap-x-6 gap-y-3">
        {KEYS.map(({ digit, letters }) => (
          <button
            key={digit}
            type="button"
            onClick={() => press(digit)}
            aria-label={digit}
            className="key flex h-[68px] w-[68px] flex-col items-center justify-center rounded-full bg-chalk/[0.055] active:bg-chalk/20"
          >
            <span className="font-display text-[30px] font-light leading-none tabular">
              {digit}
            </span>
            <span className="mt-[3px] h-[10px] text-[9px] font-semibold leading-[10px] tracking-[0.16em] text-mute">
              {letters ?? ""}
            </span>
          </button>
        ))}

        <span aria-hidden />

        <button
          type="button"
          onClick={() => press("0")}
          aria-label="0"
          className="key flex h-[68px] w-[68px] flex-col items-center justify-center rounded-full bg-chalk/[0.055] active:bg-chalk/20"
        >
          <span className="font-display text-[30px] font-light leading-none tabular">
            0
          </span>
          <span className="mt-[3px] h-[10px]" />
        </button>

        {/* Delete only appears once there is something to delete. */}
        <button
          type="button"
          onClick={back}
          aria-label="Delete"
          tabIndex={pin.length ? 0 : -1}
          className={`flex h-[68px] w-[68px] items-center justify-center rounded-full text-chalk transition-opacity duration-200 active:opacity-40 ${
            pin.length ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <svg
            viewBox="0 0 28 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M9.5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-14L2 12z" />
            <path d="M13 9.5l6 5m0-5l-6 5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
