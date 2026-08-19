"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Configured only when both env vars are present. Without them the app drops
 * into a device-local mode so `npm run dev` works out of the box — you can
 * click through the whole tournament before ever creating a Supabase project.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url!, anonKey!, {
      realtime: { params: { eventsPerSecond: 20 } },
    });
  }
  return client;
}
