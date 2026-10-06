-- Subsidiehulp Fase 2 (architectuurdoc "Subsidiehulp SMV Advies —
-- inventarisatie en architectuurontwerp", sectie F/J) — Fase 1
-- (0034 n.v.t. hier; zie DossierTaken.jsx-koppelingen) maakte de al
-- bestaande dossier_taken.adviespunt_id/document_id bruikbaar, maar
-- dossier_taken blijft puur een actielijst: er bestaat nergens een
-- structurele rij die zegt "dit is één subsidietraject, voor regeling
-- X, ter waarde van Y, in status Z, met deadline D". Die kennis zat tot
-- nu toe alleen in vrije tekst (omschrijving/notitie). Deze migratie
-- voegt precies dát toe — niet meer.
--
-- Bewust NIET toegevoegd (zie sectie F/J, "architectuurregels" uit de
-- opdracht):
--   * geen subsidie_regelingen (centrale regelingendatabase) — dat is
--     Fase 4, pas nodig zodra regeling_naam niet langer vrije tekst mag
--     zijn. Hier blijft regeling_naam vrije tekst, exact zoals
--     dossier_taken.omschrijving dat nu al is.
--   * geen subsidie_id-kolom op dossier_taken — die stond als mogelijke
--     latere uitbreiding in het ontwerp, maar niets gebruikt hem nog
--     (geen UI, geen koppeling). Een ongebruikte FK toevoegen is precies
--     het probleem dat Fase 1 net oploste voor adviespunt_id/document_id
--     op dossier_taken; die fout herhalen we hier niet voor een kolom
--     die nog geen bestaansreden heeft.
--   * geen automatische subsidiematching of -claim — puur administratie,
--     door de adviseur zelf ingevoerd (regel 13 uit de opdracht).
create table public.dossier_subsidies (
  subsidie_id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(dossier_id) on delete cascade,
  -- Vrije tekst, bewust: zie toelichting hierboven. Geen FK naar een
  -- regelingendatabase die nog niet bestaat (en nu ook niet nodig is).
  regeling_naam text not null,
  verwacht_bedrag numeric(10, 2) check (verwacht_bedrag is null or verwacht_bedrag >= 0),
  status text not null default 'voorbereiding' check (status in ('voorbereiding', 'ingediend', 'toegekend', 'afgewezen', 'verantwoord')),
  deadline date,
  notitie text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index dossier_subsidies_dossier_idx on public.dossier_subsidies (dossier_id);

-- Koppeltabel: welke maatregelen (adviespunten) vallen onder welke
-- subsidie — n-op-n, omdat één subsidie-aanvraag meerdere maatregelen
-- kan dekken (bv. één ISDE-aanvraag voor warmtepomp + isolatie samen).
-- Geen directe kolom op adviespunten of dossier_subsidies: dat zou die
-- n-op-n-relatie niet kunnen uitdrukken.
create table public.dossier_subsidie_maatregelen (
  id uuid primary key default gen_random_uuid(),
  subsidie_id uuid not null references public.dossier_subsidies(subsidie_id) on delete cascade,
  adviespunt_id uuid not null references public.adviespunten(adviespunt_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (subsidie_id, adviespunt_id)
);
create index dossier_subsidie_maatregelen_subsidie_idx on public.dossier_subsidie_maatregelen (subsidie_id);
create index dossier_subsidie_maatregelen_adviespunt_idx on public.dossier_subsidie_maatregelen (adviespunt_id);

-- Koppeltabel: welke al bestaande documenten (offerte/factuur/
-- betaalbewijs/subsidiebeschikking) horen bij welke subsidie — opnieuw
-- n-op-n (één document, bv. een factuur, kan bij meerdere subsidies
-- relevant zijn) en hergebruikt de bestaande `documenten`-tabel/opslag
-- volledig. Geen nieuw opslagsysteem, geen dubbele upload, geen
-- duplicatie van het document zelf.
create table public.dossier_subsidie_documenten (
  id uuid primary key default gen_random_uuid(),
  subsidie_id uuid not null references public.dossier_subsidies(subsidie_id) on delete cascade,
  document_id uuid not null references public.documenten(document_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (subsidie_id, document_id)
);
create index dossier_subsidie_documenten_subsidie_idx on public.dossier_subsidie_documenten (subsidie_id);
create index dossier_subsidie_documenten_document_idx on public.dossier_subsidie_documenten (document_id);

comment on table public.dossier_subsidies is 'Eén rij per subsidietraject binnen een dossier (regeling, bedrag, aanvraagstatus, deadline) — administratie door de adviseur, nooit automatisch afgeleid of toegekend.';
comment on column public.dossier_subsidies.regeling_naam is 'Vrije tekst (bv. "ISDE", "EIA") — bewust géén FK naar een regelingendatabase; die bestaat nog niet (zie Fase 4 van het architectuurontwerp).';
comment on column public.dossier_subsidies.verwacht_bedrag is 'Optionele, door de adviseur ingeschatte/aangevraagde indicatie — nooit een automatische berekening of toezegging.';
comment on table public.dossier_subsidie_maatregelen is 'Koppeltabel n-op-n: welke adviespunten (maatregelen) vallen onder welke subsidie.';
comment on table public.dossier_subsidie_documenten is 'Koppeltabel n-op-n: welke bestaande documenten (uit de documenten-tabel) horen bij welke subsidie — geen dubbele opslag.';

-- Volledig admin-only — zelfde overweging en exact hetzelfde patroon als
-- dossier_taken (0026_dossier_taken.sql): dit is intern subsidiebeheer
-- door SMV, geen klantgericht scherm. Een klantzicht is een aparte,
-- bewuste SELECT-policy-uitbreiding in een latere ronde, niet iets wat
-- deze migratie stilzwijgend meegeeft.
alter table public.dossier_subsidies enable row level security;

create policy dossier_subsidies_select_admin on public.dossier_subsidies for select
  using (public.is_admin());
create policy dossier_subsidies_insert_admin on public.dossier_subsidies for insert
  with check (public.is_admin());
create policy dossier_subsidies_update_admin on public.dossier_subsidies for update
  using (public.is_admin())
  with check (public.is_admin());
create policy dossier_subsidies_delete_admin on public.dossier_subsidies for delete
  using (public.is_admin());

alter table public.dossier_subsidie_maatregelen enable row level security;

create policy dossier_subsidie_maatregelen_select_admin on public.dossier_subsidie_maatregelen for select
  using (public.is_admin());
create policy dossier_subsidie_maatregelen_insert_admin on public.dossier_subsidie_maatregelen for insert
  with check (public.is_admin());
create policy dossier_subsidie_maatregelen_delete_admin on public.dossier_subsidie_maatregelen for delete
  using (public.is_admin());

alter table public.dossier_subsidie_documenten enable row level security;

create policy dossier_subsidie_documenten_select_admin on public.dossier_subsidie_documenten for select
  using (public.is_admin());
create policy dossier_subsidie_documenten_insert_admin on public.dossier_subsidie_documenten for insert
  with check (public.is_admin());
create policy dossier_subsidie_documenten_delete_admin on public.dossier_subsidie_documenten for delete
  using (public.is_admin());
