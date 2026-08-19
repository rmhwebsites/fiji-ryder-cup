"use client";

import { parForHole, SCORE_LABELS, scoreName } from "@/lib/course";
import { BeerIcon } from "./ui";

const NAME_COLOR: Record<string, string> = {
  albatross: "text-fuchsia-700",
  eagle: "text-amber-700",
  birdie: "text-cyan-700",
  par: "text-mute",
  bogey: "text-mute",
  double: "text-mute",
  other: "text-mute",
};

/**
 * A single score input.
 *
 * Tapping the empty box drops par straight in, so a par is one tap and a
 * birdie is two. The minus and plus handle everything else without ever
 * opening a keyboard.
 *
 * Read-only when there is no `onChange` — the same row renders on the public
 * board, minus the controls, so a spectator and a player see the same card.
 */
export function ScoreStepper({
  label,
  sublabel,
  hole,
  value,
  accent,
  disabled,
  onChange,
}: {
  label: string;
  sublabel?: string;
  hole: number;
  value: number | null;
  accent: string;
  disabled?: boolean;
  onChange?: (strokes: number) => void;
}) {
  const par = parForHole(hole);
  const readOnly = !onChange;

  // Only the scores worth calling out. Tagging every par "PAR" put a label on
  // almost every row and turned the card into noise — the number already says
  // it, and the colour is reserved for the ones that earn it.
  const scored = value !== null ? scoreName(value, hole) : null;
  const name =
    scored === "birdie" || scored === "eagle" || scored === "albatross"
      ? scored
      : null;

  const bump = (delta: number) => {
    if (!onChange) return;
    const next = value === null ? par : value + delta;
    onChange(Math.min(Math.max(next, 1), 15));
  };

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className={`truncate text-base leading-snug font-semibold ${accent}`}>
          {label}
        </p>
        {sublabel && (
          <p className="truncate text-sm font-medium text-mute">{sublabel}</p>
        )}
        {name && SCORE_LABELS[name] && (
          <p className={`text-sm font-bold ${NAME_COLOR[name]}`}>
            {SCORE_LABELS[name]}
          </p>
        )}
      </div>

      {readOnly ? (
        <div
          className={`grid h-14 w-16 shrink-0 place-items-center rounded-xl border font-display text-3xl font-extrabold tabular ${
            value === null
              ? "border-dashed border-line bg-ink text-mute/60"
              : "border-line bg-ink text-chalk"
          }`}
        >
          {value ?? "–"}
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => bump(-1)}
            aria-label={`${label} one less`}
            className="grid h-13 w-13 place-items-center rounded-xl border border-line bg-ink-3 text-2xl font-bold text-chalk active:scale-90 disabled:opacity-40"
          >
            −
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => value === null && onChange(par)}
            aria-label={`${label} score, currently ${value ?? "not set"}`}
            className={`grid h-14 w-16 place-items-center rounded-xl border font-display text-3xl font-extrabold tabular active:scale-95 disabled:opacity-40 ${
              value === null
                ? "border-dashed border-line bg-ink text-mute"
                : "border-line bg-ink text-chalk"
            }`}
          >
            {value ?? par}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => bump(1)}
            aria-label={`${label} one more`}
            className="grid h-13 w-13 place-items-center rounded-xl border border-line bg-ink-3 text-2xl font-bold text-chalk active:scale-90 disabled:opacity-40"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Beer counter for one pairing on one hole. The big button is the whole point —
 * tap it as the can is cracked and move on.
 */
export function BeerCounter({
  label,
  holeCount,
  total,
  target,
  accent,
  disabled,
  onChange,
}: {
  label: string;
  holeCount: number;
  total: number;
  /** Pace target to show behind the total, e.g. 18 for a pairing. */
  target?: number;
  accent: string;
  disabled?: boolean;
  onChange: (next: number) => void;
}) {
  return (
    <div className="rounded-xl border border-line bg-ink-3/50 p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className={`truncate text-sm font-bold ${accent}`}>{label}</p>
        <p className="shrink-0 text-sm font-semibold text-mute">
          <span className="tabular text-beer">{total}</span>
          {target ? `/${target}` : " today"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || holeCount === 0}
          onClick={() => onChange(Math.max(0, holeCount - 1))}
          aria-label={`${label}: one fewer beer on this hole`}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-line bg-ink text-xl font-bold text-mute active:scale-90 disabled:opacity-30"
        >
          −
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(holeCount + 1)}
          aria-label={`${label}: add a beer on this hole`}
          className="relative flex h-12 flex-1 items-center justify-center gap-2 overflow-hidden rounded-lg border border-beer/40 bg-beer/12 font-display text-base font-bold text-beer active:scale-95 disabled:opacity-40"
        >
          <BeerIcon className="h-5 w-5" />
          <span className="tabular">{holeCount}</span>
          <span className="text-sm font-semibold opacity-70">this hole</span>
        </button>
      </div>
    </div>
  );
}
