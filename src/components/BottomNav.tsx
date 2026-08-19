"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Three tabs.
 *
 * The board (Live) is where everyone lives — the leaderboard and all ten
 * groups on one screen, readable without a code. Players is the only place the
 * scoring code exists: unlock once, claim your group once, keep the card.
 * Teams is the draw.
 */
const TABS = [
  { href: "/", label: "Live", icon: "M3 12h4l3 8 4-16 3 8h4" },
  {
    href: "/players",
    label: "Players",
    icon: "M12 15a4 4 0 100-8 4 4 0 000 8zM4.5 20a7.5 7.5 0 0115 0",
  },
  {
    href: "/teams",
    label: "Teams",
    icon: "M9 13a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 19a7 7 0 0114 0M17.5 12.5a3 3 0 10-2-5.2M22 18a5 5 0 00-3.5-4.8",
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink-2/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-stretch sm:max-w-3xl">
        {TABS.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/" || pathname.startsWith("/match/")
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-sm font-semibold transition-colors ${
                active ? "text-chalk" : "text-mute"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                aria-hidden
              >
                <path d={tab.icon} />
              </svg>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
