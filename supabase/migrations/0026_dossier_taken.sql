-- Generieke dossier-taakstructuur (productworkflow-analyseronde) —
-- aanleiding: de Gold-template heeft twee tabellen (subsidiebegeleidingsplan
-- en opleveringchecklist) die structureel hetzelfde soort informatie
-- bevatten: een stap/actie, een verantwoordelijke, een deadline/status en
-- optioneel een gekoppeld document. In plaats van twee (of straks meer)
-- losse CRUD-systemen te bouwen — exact wat de opdracht wil voorkomen —
-- is dit één tabel met een `categorie`-kolom. Nieuwe categorieën
-- (toekomstige Gold-acties) kunnen later zonder nieuwe tabel toegevoegd
-- worden, alleen de check-constraint hoeft dan uitgebreid.
--
-- Business-beslissing (klant bevestigd): de 3 subsidiestappen en 5
-- opleveringitems uit de template zijn een STANDAARDSET die per dossier
-- voorgesteld kan worden, maar het dossier zelf blijft leidend — stappen/
-- items zijn aanpasbaar, toevoegbaar en verwijderbaar. Deze tabel bevat
-- dus geen vaste rijen; de standaardset wordt als pure data in
-- lib/dossier/dossierTaken.js gedefinieerd en pas bij een expliciete
-- adviseursactie ("vul standaard checklist") als losse, direct bewerkbare
-- rijen aangemaakt — nooit stilzwijgend, nooit een sjabloon dat achteraf
-- weer "terugspringt".
create table public.dossier_taken (
  taak_id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(dossier_id) on delete cascade,
  -- Optioneel: welke maatregel (adviespunt) deze taak betreft — bijv. een
  -- subsidiestap die specifiek bij één maatregel hoort. Leeg = dossierbreed.
  adviespunt_id uuid references public.adviespunten(adviespunt_id) on delete set null,
  categorie text not null check (categorie in ('subsidie', 'oplevering')),
  omschrijving text not null,
  verantwoordelijke text,
  deadline date,
  status text not null default 'open' check (status in ('open', 'in_uitvoering', 'afgerond')),
  -- Bepaalt de weergavevolgorde binnen een categorie — laat de standaardset
  -- (EIA-melding vóór ISDE-aanvraag vóór nacalculatie) intact, ook nadat de
  -- adviseur zelf stappen toevoegt/verwijdert.
  volgorde smallint not null default 0,
  document_id uuid references public.documenten(document_id) on delete set null,
  notitie text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index dossier_taken_dossier_idx on public.dossier_taken (dossier_id);
create index dossier_taken_categorie_idx on public.dossier_taken (dossier_id, categorie, volgorde);
create index dossier_taken_adviespunt_idx on public.dossier_taken (adviespunt_id);

-- Volledig admin-only — zelfde overweging als planning_afspraken/
-- dossier_commerciele_kansen: dit is intern voortgangsbeheer door SMV,
-- geen klantgericht scherm. Als de klant dit later wél moet zien
-- (bijv. subsidiestatus in "Mijn advies"), is dat een aparte, bewuste
-- SELECT-policy-uitbreiding — niet iets wat deze ronde stilzwijgend meegeeft.
alter table public.dossier_taken enable row level security;

create policy dossier_taken_select_admin on public.dossier_taken for select
  using (public.is_admin());
create policy dossier_taken_insert_admin on public.dossier_taken for insert
  with check (public.is_admin());
create policy dossier_taken_update_admin on public.dossier_taken for update
  using (public.is_admin())
  with check (public.is_admin());
create policy dossier_taken_delete_admin on public.dossier_taken for delete
  using (public.is_admin());
