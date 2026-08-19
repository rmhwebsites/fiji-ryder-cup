# FIJI Ryder Cup

Live matchplay scoring for the FIJI Ryder Cup — **Honey Badgers vs Gators**,
10 groups, 40 players, at the UGA Golf Course in Athens, GA.
First tee **2:00 PM, Thursday 20 August 2026**.

Built mobile first and light themed, for a phone held at arm's length in
Georgia sun. Players enter scores from the tee box, everyone else watches the
board move.

## The format

| | |
|---|---|
| **Holes 1–9** | Best ball — both players post a gross score, the team takes the lower one |
| **Holes 10–18** | Scramble — the pairing plays one ball and posts one score |
| **Points** | Each nine is its own matchplay match worth **1 point**, or **½ each** if it finishes level |
| **Total** | **20 points**, 10.5 wins the cup, 10–10 is a tie |
| **Handicaps** | None, anywhere. Every match is straight gross and no handicap is shown in the app |
| **Beers** | Each pairing drinks **18 over the round** — roughly one a hole. Logged per player, shown as a quiet status bar racing to 18 |

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
   **publishable key** (`sb_publishable_...`) from **Project Settings → API
   Keys**. The **secret key** (`sb_secret_...`) from the same page is optional
   and powers only `npm run reset` — it bypasses row level security, so it
   never gets a `NEXT_PUBLIC_` prefix and never goes to Vercel.
4. Restart `npm run dev`. The header should read **Live**.

> **If `supabase db push` or `psql` cannot connect:** the direct connection
> host, `db.<ref>.supabase.co`, resolves to IPv6 only. On an IPv4-only network
> — most CI runners, some corporate and home connections — it will simply time
> out. Use the **session pooler** string from **Project Settings → Database**
> instead (`aws-<n>-<region>.pooler.supabase.com`), which is dual-stack. The
> app itself is unaffected: it talks HTTPS to `<ref>.supabase.co`, not Postgres.

### Deploying

Any Next.js host works. On Vercel: import the repo, add
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, deploy.
(`NEXT_PUBLIC_` values bake in at build time — adding or changing one means
redeploying.) Send everyone the URL and tell them to add it to their home
screen.

To wipe a test run before the real round:

```bash
npm run reset -- --yes
```

which clears every score and beer and verifies the tables read empty. It needs
the secret key in `.env.local`; the truncate comment at the bottom of
[`supabase/schema.sql`](supabase/schema.sql) does the same job from the SQL
editor.

## Watching vs scoring

**Watching needs nothing.** The board and every group's hole-by-hole card are
open to anyone with the link — no code, no claim. That is the whole point: the
thirty-six people not in your group can follow it.

**Scoring happens in one place**, the Players tab, in two steps done once each:

1. Enter the scoring code — set `NEXT_PUBLIC_SCORING_PIN`, or leave it and the
   code is **3454**. It is an iPhone-style passcode screen; the fourth digit
   submits itself.
2. Claim your group. From then on that phone opens straight onto your card.

A claim covers **the whole group, all four players** — either partner can enter
for the other, and either pairing can enter for the other. One person keeping
the card for the group is how it actually works out there, and a hole should
never stall because the other pair left their phone in the cart.

To be clear about what the code is: a guard against a spectator fat-fingering a
number into someone else's card, not a security boundary. Anyone with the link
can read scores, and anyone with the code can write them. That is the right
trade for a golf tournament — keep the code among the 40 players.

## Out on the course

Signal at a golf course is what it is, so every score is written to the phone
first and pushed to the server in the background. If the push fails it goes into
a queue that survives a refresh and drains the moment the phone finds a bar
again. The header shows **Live**, **Offline**, or a queued count. Nobody has to
think about it — keep tapping.

## Screens

Two tabs:

- **Live** — the cup score, the run to 10.5, the beer race, and all 10 groups
  split into on the course / yet to tee off / in the clubhouse. A group shows
  its tee time until it posts a first score, then flips to its match status.
  Tap any group for its full card — read-only, open to everyone
- **Players** — the only screen that asks for the code. Unlock, claim your
  group, keep the card

Each card on the board is a game row: the two pairings, the score of the nine
being played — "Hole 13 · Back 9, 2 UP thru 3", flipping to level at the turn
because each nine is its own match — and one thin beer bar. A level nine reads
**TIE**.

Tapping a group opens the full scorecard: par, both individual scores a side on
the front nine, what each side posted, and who took each hole — a dot for a
win, a blank square for a halve, with each side's holes won listed under the
table lowest to highest. It scrolls sideways with the names pinned, and tapping
a hole jumps the hole card to it. Spectators get the scorecard first; a player
on their own card gets score entry first, because that is what they came to do.

At the bottom of every matchup sits the beer card: the same 18 columns, one row
per player plus the pairing total the 18-a-side target is measured against.

Birdies and eagles fire a burst on entry, and whenever a nine is decided a
banner drops on every phone watching — including a halved nine, where both
teams pick up a half point.

## Editing the tournament

Everything about the event lives in two files:

- [`src/lib/tournament.ts`](src/lib/tournament.ts) — teams, the 10 pairings,
  all 40 players, and the tee sheet. Tee times are absolute instants at
  `-04:00`: August is daylight saving, so Eastern that day is EDT, and writing
  `-05:00` for "EST" would drag the whole draw an hour off the sheet
- [`src/lib/course.ts`](src/lib/course.ts) — hole pars and the beer target

## Tests

```bash
npm test
```

Covers the matchplay engine — best ball, scramble, hole winners, closeouts
(`3&2`), dormie, halved nines, no-carryover, the beer pace bands and a full
10–10 tie — plus the draw itself, checked group by group against the tee sheet
and pinned to the right date in course time.
