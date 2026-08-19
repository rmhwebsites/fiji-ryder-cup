import type { Metadata, Viewport } from "next";

import { TournamentProvider } from "@/components/TournamentProvider";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "FIJI Ryder Cup",
  description:
    "Live matchplay scoring for the FIJI Ryder Cup — Honey Badgers vs Gators at UGA Golf Course.",
  appleWebApp: {
    capable: true,
    title: "FIJI Ryder Cup",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#07090c",
  width: "device-width",
  initialScale: 1,
  // Stop a double-tap on the score stepper zooming the page mid-round.
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <TournamentProvider>
          <div className="mx-auto min-h-dvh w-full max-w-lg pb-20">
            {children}
          </div>
          <BottomNav />
        </TournamentProvider>
      </body>
    </html>
  );
}
