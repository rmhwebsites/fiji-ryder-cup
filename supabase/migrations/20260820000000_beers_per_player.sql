-- Beers move from per-pairing to per-player.
--
-- slot mirrors the scores table: 1 and 2 are the pairing's two players. 0 is
-- reserved for rows written before this migration — they stay valid and still
-- count toward the pairing's total, they just belong to nobody in particular.

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
