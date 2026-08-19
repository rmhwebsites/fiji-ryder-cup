-- FIJI RYDER CUP — database schema.
--
-- Paste this whole file into the Supabase SQL editor and run it once.
-- Safe to re-run: everything is create-if-not-exists / drop-then-create.

-- ─────────────────────────────────────────────────────────────────────────
-- Strokes
--
-- slot 1 and 2 are the two players of a pairing (front nine, best ball).
-- slot 0 is the pairing's single scramble score (back nine).
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.scores (
  match_no   smallint    not null check (match_no between 1 and 10),
  hole       smallint    not null check (hole between 1 and 18),
  team       text        not null check (team in ('badgers', 'gators')),
  slot       smallint    not null check (slot between 0 and 2),
  strokes    smallint    not null check (strokes between 1 and 20),
  updated_at timestamptz not null default now(),
  primary key (match_no, hole, team, slot)
);

-- ─────────────────────────────────────────────────────────────────────────
-- Beers, logged per pairing per hole. 18 over the round is the target.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.beers (
  match_no   smallint    not null check (match_no between 1 and 10),
  hole       smallint    not null check (hole between 1 and 18),
  team       text        not null check (team in ('badgers', 'gators')),
  beers      smallint    not null check (beers between 0 and 30),
  updated_at timestamptz not null default now(),
  primary key (match_no, hole, team)
);

-- ─────────────────────────────────────────────────────────────────────────
-- Access.
--
-- This is a golf tournament, not a bank. Anyone holding the app link can
-- read and write scores; the PIN in the app is a guard against fat-fingering
-- someone else's card, not a security boundary. Keep the link among the 40
-- players and you are fine.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.scores enable row level security;
alter table public.beers  enable row level security;

drop policy if exists "scores open access" on public.scores;
create policy "scores open access" on public.scores
  for all using (true) with check (true);

drop policy if exists "beers open access" on public.beers;
create policy "beers open access" on public.beers
  for all using (true) with check (true);

-- ─────────────────────────────────────────────────────────────────────────
-- Realtime — this is what pushes a score to all 40 phones instantly.
-- ─────────────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.scores;
alter publication supabase_realtime add table public.beers;

-- ─────────────────────────────────────────────────────────────────────────
-- Reset the board (use before the shotgun start, or to wipe a test run).
-- ─────────────────────────────────────────────────────────────────────────
-- truncate public.scores, public.beers;
