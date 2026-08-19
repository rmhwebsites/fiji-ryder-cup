"use client";

import Link from "next/link";

import { SEGMENT_META } from "@/lib/course";
import type { BeerStatus, SegmentStatus } from "@/lib/scoring";
import { TEAMS, type TeamId } from "@/lib/tournament";

export const TEAM_STYLE: Record<
  TeamId,
  { text: string; bg: string; border: string; solid: string; grad: string }
> = {
  badgers: {
    text: "text-badger",
    bg: "bg-badger/12",
    border: "border-badger/35",
    solid: "bg-badger text-ink",
    grad: "from-badger to-badger-glow",
  },
  gators: {
    text: "text-gator",
    bg: "bg-gator/12",
    border: "border-gator/35",
    solid: "bg-gator text-ink",
    grad: "from-gator to-gator-glow",
  },
};

/** Small "LIVE" dot with the connection state behind it. */
export function LiveDot({
  connection,
  pending,
}: {
  connection: string;
  pending: number;
}) {
  const map: Record<string, { label: string; color: string; pulse: boolean }> = {
    live: { label: "LIVE", color: "bg-gator", pulse: true },
    connecting: { label: "SYNCING", color: "bg-beer", pulse: true },
    offline: { label: "OFFLINE", color: "bg-flag", pulse: false },
    local: { label: "ON DEVICE", color: "bg-mute", pulse: false },
  };
  const state = map[connection] ?? map.local;

  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-mute">
      <span
        className={`h-1.5 w-1.5 rounded-full ${state.color} ${state.pulse ? "anim-live" : ""}`}
      />
      {state.label}
      {pending > 0 && (
        <span className="text-beer">· {pending} queued</span>
      )}
    </span>
  );
}

/**
 * The status of one nine — "2 UP", "3&2", "AS" — coloured by whoever leads.
 */
export function SegmentPill({
  status,
  compact = false,
}: {
  status: SegmentStatus;
  compact?: boolean;
}) {
  const meta = SEGMENT_META[status.segment];

  if (!status.started) {
    return (
      <div className="flex-1 rounded-xl border border-line bg-ink-3/40 px-3 py-2">
        <p className="text-[10px] font-bold tracking-widest text-mute">
          {compact ? meta.short : meta.label.toUpperCase()}
        </p>
        <p className="text-sm font-bold text-mute">—</p>
      </div>
    );
  }

  const style = status.leader ? TEAM_STYLE[status.leader] : null;

  return (
    <div
      className={`flex-1 rounded-xl border px-3 py-2 ${
        style ? `${style.bg} ${style.border}` : "border-line bg-ink-3/60"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-bold tracking-widest text-mute">
          {compact ? meta.short : meta.label.toUpperCase()}
        </p>
        <p className="text-[10px] font-semibold text-mute">
          {status.finished ? "FINAL" : `thru ${status.thru}`}
        </p>
      </div>
      <p
        className={`font-display text-lg leading-tight font-black tabular ${
          style ? style.text : "text-chalk"
        }`}
      >
        {status.result}
      </p>
      {status.leader && (
        <p className="truncate text-[10px] font-semibold text-mute">
          {TEAMS[status.leader].shortName}
        </p>
      )}
    </div>
  );
}

const PACE_STYLE: Record<BeerStatus["pace"], string> = {
  sending: "text-beer border-beer/45 bg-beer/12",
  ahead: "text-beer border-beer/35 bg-beer/10",
  "on-pace": "text-gator border-gator/35 bg-gator/10",
  behind: "text-orange-300 border-orange-400/35 bg-orange-400/10",
  parched: "text-flag border-flag/40 bg-flag/12",
  idle: "text-mute border-line bg-ink-3/40",
};

export function BeerIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M6 8h9v11a2 2 0 01-2 2H8a2 2 0 01-2-2V8z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <path
        d="M15 10h2.5a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5H15"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <path
        d="M6 8c0-1.7 1.3-3 3-3 .4-1.2 1.5-2 2.8-2 1.5 0 2.7 1 3 2.4 1.2.2 2.2 1.3 2.2 2.6"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Beer count for a pairing with its pace verdict. Before a group tees off the
 * verdict is dropped — ten cards all shouting NOT STARTED is just noise.
 */
export function BeerChip({ status }: { status: BeerStatus }) {
  const idle = status.pace === "idle";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${PACE_STYLE[status.pace]}`}
    >
      <BeerIcon />
      <span className="tabular">{status.total}</span>
      {!idle && <span className="opacity-80">{status.label}</span>}
    </span>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between px-1">
      <h2 className="text-[11px] font-bold tracking-[0.18em] text-mute">
        {children}
      </h2>
      {action && (
        <Link
          href={action.href}
          className="text-[11px] font-bold tracking-wide text-mute underline-offset-4 hover:text-chalk hover:underline"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
