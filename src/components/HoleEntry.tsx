"use client";

import { parForHole, SCORE_LABELS, scoreName } from "@/lib/course";
import { BeerIcon } from "./ui";

const NAME_COLOR: Record<string, string> = {
  albatross: "text-fuchsia-300",
  eagle: "text-amber-300",
  birdie: "text-sky-300",
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
  onChange: (strokes: number) => void;
}) {
  const par = parForHole(hole);
  const name = value !== null ? scoreName(value, hole) : null;

  const bump = (delta: number) => {
    const next = value === null ? par : value + delta;
    onChange(Math.min(Math.max(next, 1), 15));
  };

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm leading-tight font-bold ${accent}`}>
          {label}
        </p>
        {sublabel && (
          <p className="truncate text-[10px] font-semibold text-mute">
            {sublabel}
          </p>
        )}
        {name && SCORE_LABELS[name] && (
          <p
            className={`text-[10px] font-black tracking-wider ${NAME_COLOR[name]}`}
          >
            {SCORE_LABELS[name]}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => bump(-1)}
          aria-label={`${label} one less`}
          className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-ink-3 text-xl font-black text-chalk active:scale-90 disabled:opacity-40"
        >
          −
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => value === null && onChange(par)}
          aria-label={`${label} score, currently ${value ?? "not set"}`}
          className={`grid h-12 w-14 place-items-center rounded-xl border font-display text-2xl font-black tabular active:scale-95 disabled:opacity-40 ${
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
          className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-ink-3 text-xl font-black text-chalk active:scale-90 disabled:opacity-40"
        >
          +
        </button>
      </div>
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
  accent,
  disabled,
  onChange,
}: {
  label: string;
  holeCount: number;
  total: number;
  accent: string;
  disabled?: boolean;
  onChange: (next: number) => void;
}) {
  return (
    <div className="rounded-xl border border-line bg-ink-3/50 p-2.5">
      <div className="mb-2 flex items-baseline justify-between gap-1">
        <p className={`truncate text-[10px] font-black tracking-wider ${accent}`}>
          {label}
        </p>
        <p className="shrink-0 text-[10px] font-bold text-mute">
          <span className="tabular text-beer">{total}</span>/18
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={disabled || holeCount === 0}
          onClick={() => onChange(Math.max(0, holeCount - 1))}
          aria-label={`${label}: one fewer beer on this hole`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-ink text-lg font-black text-mute active:scale-90 disabled:opacity-30"
        >
          −
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(holeCount + 1)}
          aria-label={`${label}: add a beer on this hole`}
          className="relative flex h-10 flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-beer/40 bg-beer/12 font-display text-sm font-black text-beer active:scale-95 disabled:opacity-40"
        >
          <BeerIcon className="h-4 w-4" />
          <span className="tabular">{holeCount}</span>
          <span className="text-[10px] font-bold opacity-70">this hole</span>
        </button>
      </div>
    </div>
  );
}
