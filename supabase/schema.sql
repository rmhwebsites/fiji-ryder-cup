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
-- Beers, logged per player per hole. 18 over the round per pairing is the
-- target. slot 1 and 2 are the pairing's two players, matching scores; slot 0
-- is a legacy team-level row from before beers were per player.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.beers (
  match_no   smallint    not null check (match_no between 1 and 10),
  hole       smallint    not null check (hole between 1 and 18),
  team       text        not null check (team in ('badgers', 'gators')),
  slot       smallint    not null default 0 check (slot between 0 and 2),
  beers      smallint    not null check (beers between 0 and 30),
  updated_at timestamptz not null default now(),
  primary key (match_no, hole, team, slot)
);

-- Upgrade a beers table created before the slot column existed. Both steps
-- are no-ops on a fresh install, keeping the file re-runnable.
alter table public.beers
  add column if not exists slot smallint not null default 0
  check (slot between 0 and 2);

do $$
begin
  if not exists (
    select 1 from information_schema.key_column_usage
    where table_schema = 'public' and table_name = 'beers'
      and constraint_name = 'beers_pkey' and column_name = 'slot'
  ) then
    alter table public.beers drop constraint beers_pkey;
    alter table public.beers
      add constraint beers_pkey primary key (match_no, hole, team, slot);
  end if;
end $$;

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
--
-- Adding a table that is already in the publication raises duplicate_object,
-- so swallow it and keep the whole file re-runnable.
-- ─────────────────────────────────────────────────────────────────────────
do $$
begin
  alter publication supabase_realtime add table public.scores;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.beers;
exception
  when duplicate_object then null;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- Reset the board (use before the shotgun start, or to wipe a test run).
-- ─────────────────────────────────────────────────────────────────────────
-- truncate public.scores, public.beers;
