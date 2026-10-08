-- Subsidie-aanvraagbegeleiding (2026-10-xx) — technische invoer per
-- concrete isolatiemaatregel (dak/gevel), los van de al bestaande
-- dossier_subsidies (0035_dossier_subsidies.sql). Bewust GEEN uitbreiding
-- van dossier_subsidies: die tabel is één rij per commercieel
-- subsidietraject met een vrije-tekst regeling_naam, bedoeld voor
-- status/bedrag/deadline-opvolging van een subsidie die de adviseur al
-- heeft besloten op te pakken. Deze tabel is iets anders: de technische
-- brongegevens (jaar/oppervlakte/Rd-waarde/meldcode) die de subsidie-
-- engine nodig heeft om te BEOORDELEN of een maatregel subsidiabel is —
-- die input bestaat per definitie al vóór er een traject is, en hoort
-- dus niet in een tabel die een traject veronderstelt.
--
-- Eén rij per maatregel per dossier (unique-constraint) — net als een
-- dossier één pand beschrijft, beschrijft deze rij de situatie van één
-- bouwdeel in dat dossier. Puur invoer, geen berekening/snapshot: de
-- daadwerkelijke berekening gebeurt in de pure subsidie-engine (zie
-- src/lib/subsidie/) en wordt alleen bevroren in het gegenereerde
-- subsidiedocument zelf (documenten-tabel/storage) — exact hetzelfde
-- principe als het Adviesrapport (geen los snapshot-veld nodig, het
-- gegenereerde bestand IS de snapshot).
create table public.dossier_subsidie_specificaties (
  specificatie_id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(dossier_id) on delete cascade,
  -- Vaste, kleine set — bewust een check-constraint i.p.v. vrije tekst,
  -- zodat de subsidie-engine (die per maatregel_key een regelset opzoekt)
  -- nooit op een typefout kan stranden. Uitbreidbaar met een migratie
  -- zodra een volgende maatregel (bv. vloerisolatie) wordt toegevoegd.
  maatregel_key text not null check (maatregel_key in ('dakisolatie', 'gevelisolatie')),
  uitvoeringsjaar int,
  oppervlakte_m2 numeric(8, 2) check (oppervlakte_m2 is null or oppervlakte_m2 >= 0),
  -- Rd-waarde (m2K/W) van het toegepaste isolatiemateriaal — generieke
  -- naam ("technische_waarde") omdat een volgende maatregel een andere
  -- technische eis kan hebben (bv. een U-waarde voor glas).
  technische_waarde numeric(6, 2) check (technische_waarde is null or technische_waarde >= 0),
  meldcode text,
  -- Expliciete adviseursbevestiging dat isolatie daadwerkelijk onderdeel
  -- is van de maatregel (opdracht §75/76) — nooit automatisch afgeleid
  -- uit opname-vrije-tekst zoals "dak vervangen".
  isolatie_bevestigd text not null default 'onbekend' check (isolatie_bevestigd in ('ja', 'nee', 'onbekend')),
  notitie text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dossier_id, maatregel_key)
);
create index dossier_subsidie_specificaties_dossier_idx on public.dossier_subsidie_specificaties (dossier_id);

comment on table public.dossier_subsidie_specificaties is 'Technische invoer per isolatiemaatregel (dak/gevel) t.b.v. de subsidie-engine — adviseur-ingevoerd/bevestigd, geen automatische afleiding uit opnamedata.';

-- Volledig admin-only — zelfde patroon als dossier_subsidies
-- (0035_dossier_subsidies.sql) en dossier_taken (0026_dossier_taken.sql):
-- subsidiebegeleiding is interne SMV-functionaliteit, geen klantscherm.
alter table public.dossier_subsidie_specificaties enable row level security;

create policy dossier_subsidie_specificaties_select_admin on public.dossier_subsidie_specificaties for select
  using (public.is_admin());
create policy dossier_subsidie_specificaties_insert_admin on public.dossier_subsidie_specificaties for insert
  with check (public.is_admin());
create policy dossier_subsidie_specificaties_update_admin on public.dossier_subsidie_specificaties for update
  using (public.is_admin())
  with check (public.is_admin());
create policy dossier_subsidie_specificaties_delete_admin on public.dossier_subsidie_specificaties for delete
  using (public.is_admin());
