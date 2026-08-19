"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Live", icon: "M3 12h4l3 8 4-16 3 8h4" },
  {
    href: "/matches",
    label: "Matches",
    icon: "M4 6h16M4 12h16M4 18h16",
  },
  {
    href: "/roster",
    label: "Teams",
    icon: "M4 20a6 6 0 0112 0M10 4a4 4 0 100 8 4 4 0 000-8M17 20a5 5 0 00-3-4.6",
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink-2/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-stretch">
        {TABS.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href) ||
                (tab.href === "/matches" && pathname.startsWith("/match/"));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-1 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] text-[11px] font-semibold tracking-wide transition-colors ${
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
                className="h-5 w-5"
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
