"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useTournament, type Tournament } from "@/lib/useTournament";
import { CelebrationProvider } from "./Celebrations";

const Ctx = createContext<Tournament | null>(null);

/** Live tournament state, shared by every screen in the app. */
export function useLive(): Tournament {
  const value = useContext(Ctx);
  if (!value) {
    throw new Error("useLive must be used inside <TournamentProvider>");
  }
  return value;
}

export function TournamentProvider({ children }: { children: ReactNode }) {
  const tournament = useTournament();
  return (
    <Ctx.Provider value={tournament}>
      <CelebrationProvider
        standings={tournament.standings}
        ready={tournament.ready}
      >
        {children}
      </CelebrationProvider>
    </Ctx.Provider>
  );
}
