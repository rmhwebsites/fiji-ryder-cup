"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

// The publishable key (sb_publishable_...) is the browser-safe key from the
// dashboard's API Keys page. The legacy anon key still works as a fallback for
// projects old enough to have one. Both references must stay written out
// literally — Next.js inlines env vars into the client bundle by exact name.
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Configured only when both env vars are present. Without them the app drops
 * into a device-local mode so `npm run dev` works out of the box — you can
 * click through the whole tournament before ever creating a Supabase project.
 */
export const isSupabaseConfigured = Boolean(url && publishableKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url!, publishableKey!, {
      realtime: { params: { eventsPerSecond: 20 } },
    });
  }
  return client;
}
