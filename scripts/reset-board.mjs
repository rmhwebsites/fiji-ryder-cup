/**
 * Wipe the board — every score and every beer, all ten matches.
 *
 * For the morning of the round: click through a test run the night before,
 * then `npm run reset -- --yes` and hand the players a clean card.
 *
 * Uses the SECRET key (sb_secret_...), which carries service_role privileges
 * and bypasses row level security. It lives in .env.local, which is
 * gitignored, and is read here without the NEXT_PUBLIC_ prefix so Next.js can
 * never bundle it into the browser build.
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.\n" +
      "Both belong in .env.local — the secret key comes from the dashboard's\n" +
      "API Keys page (sb_secret_...), and must never get a NEXT_PUBLIC_ prefix.",
  );
  process.exit(1);
}

if (!process.argv.includes("--yes")) {
  console.error(
    "This permanently deletes every score and beer for all 10 matches.\n" +
      "Run it as:  npm run reset -- --yes",
  );
  process.exit(1);
}

const db = createClient(url, secretKey);

// PostgREST refuses a bare delete-everything, so the filter names every row
// explicitly: match numbers start at 1, and >= 0 covers them all.
for (const table of ["scores", "beers"]) {
  const { error } = await db.from(table).delete().gte("match_no", 0);
  if (error) {
    console.error(`Failed to clear ${table}: ${error.message}`);
    process.exit(1);
  }
}

// Trust nothing — read the row counts back before declaring the board clean.
for (const table of ["scores", "beers"]) {
  const { count, error } = await db
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) {
    console.error(`Cleared ${table}, but could not verify: ${error.message}`);
    process.exit(1);
  }
  if (count !== 0) {
    console.error(`${table} still has ${count} rows — reset incomplete.`);
    process.exit(1);
  }
  console.log(`${table}: empty`);
}

console.log("Board is clean. Play well.");
