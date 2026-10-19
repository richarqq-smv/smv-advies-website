-- Fase 6 (projectplan "Klantwaarde-uitbreidingen", #10): Opties-paneel —
-- herbruikbare feature-flag-infrastructuur in het admin-dashboard, met
-- de Benchmark-vergelijking als eerste toepassing. Generieke tabel i.p.v.
-- een losse boolean-kolom ergens, juist omdat dit bedoeld is om later
-- meer experimentele features aan toe te voegen zonder herbouw (zie
-- projectplan-randvoorwaarde).
--
-- Een rij hier wordt uitsluitend via een migratie toegevoegd (nieuwe
-- feature = nieuwe migratie met een insert, zelfde patroon als andere
-- vaste/seed-data in dit project) — er is bewust geen INSERT/DELETE-
-- policy: een admin kan een bestaande vlag aan/uit zetten, nooit zelf
-- nieuwe vlaggen verzinnen via de UI.
create table public.feature_flags (
  sleutel text primary key,
  naam text not null,
  omschrijving text,
  aan boolean not null default false,
  laatst_gewijzigd_op timestamptz not null default now()
);
comment on table public.feature_flags is 'Herbruikbare feature-flag-infrastructuur (Fase 6, #10) — elke rij is een experimentele functionaliteit die een admin aan/uit kan zetten op /admin/opties. Rijen komen uitsluitend via een migratie (seed), nooit via de UI aangemaakt/verwijderd.';

alter table public.feature_flags enable row level security;

create policy feature_flags_select_admin on public.feature_flags for select
  using (public.is_admin());

-- Alleen de bestaande kolommen mogen wijzigen (aan/laatst_gewijzigd_op) —
-- sleutel/naam/omschrijving liggen vast per migratie, dezelfde
-- "immutabel behalve het statusveld"-filosofie als elders in dit project
-- (zie bewaak_dossier_integriteit() voor het precedent), hier simpel
-- gehouden met een check i.p.v. een eigen trigger omdat er maar één veld
-- hoeft te veranderen.
create policy feature_flags_update_admin on public.feature_flags for update
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.feature_flags from public, anon;
grant select, update (aan, laatst_gewijzigd_op) on public.feature_flags to authenticated;

-- Eerste toepassing: de Benchmark-vergelijking (energiekosten per m² t.o.v.
-- vergelijkbare dossiers) — staat bewust standaard UIT totdat een admin
-- 'm zelf aanzet op /admin/opties.
insert into public.feature_flags (sleutel, naam, omschrijving, aan) values (
  'benchmark_vergelijking',
  'Benchmark-vergelijking',
  'Toont bij een dossier een vergelijking van de energiekosten per m² met vergelijkbare dossiers in het systeem (alleen zichtbaar als er genoeg vergelijkingsmateriaal is).',
  false
);
