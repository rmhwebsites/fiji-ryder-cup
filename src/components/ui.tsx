"use client";

import Link from "next/link";

import { SEGMENT_META } from "@/lib/course";
import type { SegmentStatus } from "@/lib/scoring";
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

/** Small "Live" dot with the connection state behind it. */
export function LiveDot({
  connection,
  pending,
}: {
  connection: string;
  pending: number;
}) {
  const map: Record<string, { label: string; color: string; pulse: boolean }> = {
    live: { label: "Live", color: "bg-good", pulse: true },
    connecting: { label: "Syncing", color: "bg-beer", pulse: true },
    offline: { label: "Offline", color: "bg-flag", pulse: false },
    local: { label: "On device", color: "bg-mute", pulse: false },
  };
  const state = map[connection] ?? map.local;

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-mute">
      <span
        className={`h-2 w-2 rounded-full ${state.color} ${state.pulse ? "anim-live" : ""}`}
      />
      {state.label}
      {pending > 0 && <span className="text-beer">· {pending} queued</span>}
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
  const label = compact ? meta.short : meta.label;

  if (!status.started) {
    return (
      <div className="flex-1 rounded-xl border border-line bg-ink-3/40 px-3 py-2.5">
        <p className="text-sm font-semibold text-mute">{label}</p>
        <p className="text-lg font-bold text-mute">—</p>
      </div>
    );
  }

  const style = status.leader ? TEAM_STYLE[status.leader] : null;

  return (
    <div
      className={`flex-1 rounded-xl border px-3 py-2.5 ${
        style ? `${style.bg} ${style.border}` : "border-line bg-ink-3/60"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-mute">{label}</p>
        <p className="text-sm font-medium text-mute">
          {status.finished ? "Final" : `thru ${status.thru}`}
        </p>
      </div>
      <p
        className={`font-display text-2xl leading-tight font-extrabold tabular ${
          style ? style.text : "text-chalk"
        }`}
      >
        {status.result}
      </p>
      {status.leader && (
        <p className="truncate text-sm font-medium text-mute">
          {TEAMS[status.leader].shortName}
        </p>
      )}
    </div>
  );
}

export function BeerIcon({ className = "h-4 w-4" }: { className?: string }) {
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

export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
      <h2 className="text-base font-bold text-chalk">{children}</h2>
      {action && (
        <Link
          href={action.href}
          className="shrink-0 text-sm font-semibold text-mute underline-offset-4 hover:text-chalk hover:underline"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
