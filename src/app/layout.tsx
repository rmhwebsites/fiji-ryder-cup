import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { TournamentProvider } from "@/components/TournamentProvider";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

// Self-hosted at build time, so this is a same-origin request, not a trip to
// Google — the board still paints on one bar of signal.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FIJI Ryder Cup",
  description:
    "Live matchplay scoring for the FIJI Ryder Cup — Honey Badgers vs Gators at UGA Golf Course.",
  appleWebApp: {
    capable: true,
    title: "FIJI Ryder Cup",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#eef2f7",
  width: "device-width",
  initialScale: 1,
  // Deliberately no maximumScale: pinch zoom stays available, because someone
  // will want it. Double-tap zoom on the steppers is already handled by
  // `touch-action: manipulation` on buttons in globals.css, which is the
  // narrower fix — locking the whole page at 1x to solve it took everyone's
  // zoom away as a side effect.
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh antialiased">
        <TournamentProvider>
          {/* Phone-width column by default; on a laptop it widens and the group
              lists become two columns rather than one long ribbon. */}
          <div className="mx-auto min-h-dvh w-full max-w-lg pb-28 sm:max-w-3xl">
            {children}
          </div>
          <BottomNav />
        </TournamentProvider>
      </body>
    </html>
  );
}
