-- Interne Admin-planning v1 (2026-09-28): een eenvoudige, uitsluitend
-- interne agenda voor SMV zelf (afspraken, bezoeken, gesprekken). Geen
-- bestaande planningstructuur aanwezig (gecontroleerd) — één nieuwe,
-- kleine tabel, geen aparte klant-/dossierflow.
--
-- klant_id/dossier_id zijn allebei nullable: een afspraak mag zuiver
-- intern zijn (bijv. eigen overleg), zonder klant- of dossierkoppeling.
-- `on delete set null` op allebei — een Klant/Dossier wordt in deze
-- applicatie sowieso nooit hard verwijderd (klanten/dossiers gebruiken
-- zelf al restrict/geen delete-pad), maar mocht dat ooit gebeuren dan
-- overleeft de afspraak dat gewoon (verliest alleen de koppeling) in
-- plaats van cascaderend te verdwijnen.
create table public.planning_afspraken (
  afspraak_id uuid primary key default gen_random_uuid(),
  klant_id uuid references public.klanten(klant_id) on delete set null,
  dossier_id uuid references public.dossiers(dossier_id) on delete set null,
  onderwerp text not null,
  type text not null check (type in (
    'kennismaking', 'bedrijfsbezoek', 'adviesgesprek', 'offertebespreking',
    'overleg', 'herbeoordeling', 'overig'
  )),
  datum date not null,
  starttijd time not null,
  eindtijd time not null,
  status text not null default 'gepland' check (status in ('gepland', 'afgerond', 'geannuleerd')),
  notitie text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint eindtijd_na_starttijd check (eindtijd > starttijd)
);
create index planning_afspraken_datum_idx on public.planning_afspraken (datum, starttijd);
create index planning_afspraken_klant_idx on public.planning_afspraken (klant_id);
create index planning_afspraken_dossier_idx on public.planning_afspraken (dossier_id);

-- Volledig admin-only: geen enkele policy voor een gewone klant, dus RLS
-- weigert een klant standaard elke lees/schrijfactie (geen enkele policy
-- matcht) — zelfde effect als bijv. offertes_insert_admin elders, hier
-- alleen voor alle vier de acties tegelijk omdat een klant hier nergens
-- iets van mag zien of doen.
alter table public.planning_afspraken enable row level security;

create policy planning_afspraken_select_admin on public.planning_afspraken for select
  using (public.is_admin());
create policy planning_afspraken_insert_admin on public.planning_afspraken for insert
  with check (public.is_admin());
create policy planning_afspraken_update_admin on public.planning_afspraken for update
  using (public.is_admin())
  with check (public.is_admin());
create policy planning_afspraken_delete_admin on public.planning_afspraken for delete
  using (public.is_admin());
