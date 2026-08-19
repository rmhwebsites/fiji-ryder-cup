# FIJI Ryder Cup

Live matchplay scoring for the FIJI Ryder Cup — **Honey Badgers vs Gators**,
10 groups, 40 players, at the UGA Golf Course in Athens, GA.

Built mobile first. Players enter scores from the tee box, everyone else
watches the board move.

## The format

| | |
|---|---|
| **Holes 1–9** | Best ball — both players post a gross score, the team takes the lower one |
| **Holes 10–18** | Scramble — the pairing plays one ball and posts one score |
| **Points** | Each nine is its own matchplay match worth **1 point**, or **½ each** if it finishes level |
| **Total** | **20 points**, 10.5 wins the cup, 10–10 is a tie |
| **Handicaps** | None. Every match is straight gross. Handicaps show on the Teams page for reference only |
| **Beers** | Each pairing drinks **18 over the round** — roughly one a hole. Tracked live, flagged when a group falls off pace |

Holes do not carry over. A halved hole is dead, and a nine where both sides win
the same number of holes is halved.

## Running it

```bash
npm install
npm run dev
```

That works immediately with no setup — the app falls back to storing scores on
the device so you can click through the whole tournament. To get all 40 phones
sharing one live board, point it at Supabase.

### Supabase (5 minutes)

1. Create a free project at [supabase.com](https://supabase.com).
2. Apply the schema — two tables plus realtime. Either way works and both are
   re-runnable:
   - **SQL Editor** (simplest): paste in [`supabase/schema.sql`](supabase/schema.sql)
     and run it.
   - **CLI**: `supabase link --project-ref <ref>` then `supabase db push`, which
     picks up [`supabase/migrations/`](supabase/migrations).
3. Copy `.env.example` to `.env.local` and fill in the project URL and the
   publishable (anon) key from **Project Settings → API Keys**.
4. Restart `npm run dev`. The header should read **LIVE**.

> **If `supabase db push` or `psql` cannot connect:** the direct connection
> host, `db.<ref>.supabase.co`, resolves to IPv6 only. On an IPv4-only network
> — most CI runners, some corporate and home connections — it will simply time
> out. Use the **session pooler** string from **Project Settings → Database**
> instead (`aws-<n>-<region>.pooler.supabase.com`), which is dual-stack. The
> app itself is unaffected: it talks HTTPS to `<ref>.supabase.co`, not Postgres.

### Deploying

Any Next.js host works. On Vercel: import the repo, add the same two
environment variables, deploy. Send everyone the URL and tell them to add it to
their home screen.

## The scoring code

One shared code unlocks score entry for everybody — set `NEXT_PUBLIC_SCORING_PIN`,
or leave it and the code is **1848**. Players enter it once and their phone
remembers it for the day.

To be clear about what this is: a guard against a spectator fat-fingering a
number into someone else's card, not a security boundary. Anyone with the link
can read and write scores. That is the right trade for a golf tournament — keep
the link among the 40 players.

## Out on the course

Signal at a golf course is what it is, so every score is written to the phone
first and pushed to the server in the background. If the push fails it goes into
a queue that survives a refresh and drains the moment the phone finds a bar
again. The header shows **LIVE**, **OFFLINE**, or a queued count. Nobody has to
think about it — keep tapping.

## Screens

- **Live** — team score, the run to 10.5, the beer race, and all 10 matches.
  A group shows its tee time until it posts a first score, then flips to its
  live match status
- **Matches** — every group; tap one to score it
- **Teams** — the full draw with handicaps

Birdies and eagles fire a burst on entry, and whenever a nine is decided a
banner drops on every phone watching — including a halved nine, where both
teams pick up a half point.

## Editing the tournament

Everything about the event lives in two files:

- [`src/lib/tournament.ts`](src/lib/tournament.ts) — teams, the 10 pairings and
  tee times, all 40 players and handicaps
- [`src/lib/course.ts`](src/lib/course.ts) — hole pars and the beer target

## Tests

```bash
npm test
```

Covers the matchplay engine — best ball, scramble, hole winners, closeouts
(`3&2`), dormie, halved nines, no-carryover, the beer pace bands and a full
10–10 tie — plus the draw itself, checked group by group against the tee sheet.
