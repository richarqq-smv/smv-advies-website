-- Facturen (Administratie-uitbreiding, 2026-09-28) — zelfstandige,
-- onafhankelijke snapshot van wat SMV Advies aan een Klant factureert.
-- Exact hetzelfde architectuurpatroon als offertes (0005_offertes.sql):
-- relationele FK's voor identiteit (klant_id/dossier_id/offerte_id),
-- jsonb-snapshots voor de daadwerkelijke inhoud op factuurmoment. Een
-- factuur is dus GEEN live referentie naar de huidige offerte-inhoud —
-- een latere wijziging van de offerte (voor zover een niet-concept
-- offerte al wijzigbaar zou zijn, wat het toch al niet is) raakt een
-- eenmaal aangemaakte factuur nooit.
--
-- `regels` (factuurregels) als jsonb-array, geen aparte tabel: zelfde
-- afweging als offertes.meerwerk — een kleine, altijd-samen-met-de-
-- factuur-gelezen/geschreven lijst heeft geen eigen identiteit nodig, en
-- een aparte regeltabel zou hier alleen complexiteit toevoegen zonder
-- een echt voordeel (geen enkele plek in deze applicatie muteert één
-- losse regel onafhankelijk van de rest van de factuur).
create table public.facturen (
  factuur_id uuid primary key default gen_random_uuid(),

  klant_id uuid not null references public.klanten(klant_id) on delete restrict,
  dossier_id uuid references public.dossiers(dossier_id) on delete restrict,
  offerte_id uuid references public.offertes(id) on delete restrict,

  -- Toegekend via een kolom-DEFAULT (genereer_factuur_nummer() hieronder)
  -- — nooit door de client bedacht of meegegeven, dus een niet-opgeslagen
  -- formulier verbruikt nooit een nummer, en gelijktijdige admin-sessies
  -- kunnen nooit hetzelfde nummer krijgen (nextval() is intrinsiek
  -- atomair in Postgres) — zelfde garantie als offerte_nummer.
  factuurnummer text not null unique,

  status text not null default 'concept' check (
    status in ('concept', 'verzonden', 'betaald', 'vervallen', 'geannuleerd')
  ),

  factuurdatum date not null default current_date,
  vervaldatum date not null,
  verzonden_op timestamptz,
  betaalde_op timestamptz,

  subtotaal_excl_btw numeric(10, 2) not null check (subtotaal_excl_btw >= 0),
  btw_bedrag numeric(10, 2) not null check (btw_bedrag >= 0),
  totaal_incl_btw numeric(10, 2) not null check (totaal_incl_btw >= 0),

  -- Zelfstandige momentopname van klant/contactpersoon zoals ze GOLDEN op
  -- het moment van opslaan — nooit een live verwijzing (zelfde principe
  -- als offertes.snapshot). Alleen structurele garantie op databaseniveau
  -- (een JSON-object) — de precieze vorm legt src/lib/klantOmgeving/
  -- factuur.js vast.
  klant_snapshot jsonb not null check (jsonb_typeof(klant_snapshot) = 'object'),
  regels jsonb not null check (jsonb_typeof(regels) = 'array'),

  notitie text,

  aangemaakt_door uuid not null default auth.uid() references auth.users(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint facturen_vervaldatum_na_factuurdatum check (vervaldatum >= factuurdatum)
);

create index facturen_klant_idx on public.facturen (klant_id);
create index facturen_dossier_idx on public.facturen (dossier_id);
create index facturen_offerte_idx on public.facturen (offerte_id);
create index facturen_status_idx on public.facturen (status);

-- ============================================================
-- FACTUURNUMMERING — exact hetzelfde patroon als genereer_offerte_nummer()
-- ============================================================
--
-- Eén doorlopende sequence, geen reset per jaar (zelfde reden als
-- offertes: "SMV-FAC-2026-0009" gevolgd door "SMV-FAC-2027-0010" is het
-- gevraagde gedrag). Het jaartal is een cosmetisch prefix van het moment
-- van aanmaken.
create sequence public.factuur_nummer_seq;

-- SECURITY DEFINER (zelfde patroon als genereer_offerte_nummer()/
-- is_admin()): authenticated krijgt nooit rechtstreeks USAGE op de
-- sequence, alleen via deze functie, aangeroepen als kolom-DEFAULT bij
-- het aanmaken van een factuur. Het nummer wordt dus pas daadwerkelijk
-- toegekend op het moment van INSERT (opslaan) — niet eerder, exact zoals
-- gevraagd. VOLATILE (geen `stable`) — nextval() heeft een neveneffect.
create or replace function public.genereer_factuur_nummer()
returns text
language sql
security definer
set search_path = ''
as $$
  select (select factuurprefix from public.factuur_instellingen where id = 1)
    || '-' || extract(year from now())::text || '-' || lpad(nextval('public.factuur_nummer_seq')::text, 4, '0');
$$;
revoke all on function public.genereer_factuur_nummer() from public, anon;
grant execute on function public.genereer_factuur_nummer() to authenticated;

alter table public.facturen alter column factuurnummer set default public.genereer_factuur_nummer();

-- ============================================================
-- INTEGRITEIT: status-overgangen + bevriezing — exact hetzelfde patroon
-- als bewaak_offerte_integriteit() (0005_offertes.sql).
-- ============================================================
--
-- concept: vrij wijzigbaar (op de identiteitskoppeling/het nummer na).
-- concept -> verzonden | geannuleerd
-- verzonden -> betaald | vervallen | geannuleerd
-- vervallen -> betaald | geannuleerd  (een vervallen factuur kan alsnog
--   betaald worden, of afgeboekt als geannuleerd)
-- betaald -> verzonden  (UITSLUITEND de expliciete "betaling corrigeren"-
--   actie, zie updateFactuurStatus/corrigeer_betaling in api.js — geen
--   vrije algemene status-editor die hier toevallig ook langs mag)
-- geannuleerd: volledig terminaal.
create or replace function public.bewaak_factuur_integriteit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  toegestane_overgangen jsonb := '{
    "concept": ["verzonden", "geannuleerd"],
    "verzonden": ["betaald", "vervallen", "geannuleerd"],
    "vervallen": ["betaald", "geannuleerd"],
    "betaald": ["verzonden"]
  }'::jsonb;
begin
  if NEW.klant_id <> OLD.klant_id
     or coalesce(NEW.dossier_id, '00000000-0000-0000-0000-000000000000'::uuid) <> coalesce(OLD.dossier_id, '00000000-0000-0000-0000-000000000000'::uuid)
     or coalesce(NEW.offerte_id, '00000000-0000-0000-0000-000000000000'::uuid) <> coalesce(OLD.offerte_id, '00000000-0000-0000-0000-000000000000'::uuid)
     or NEW.factuurnummer <> OLD.factuurnummer then
    raise exception 'De klant-, dossier- en offertekoppeling en het factuurnummer van een factuur kunnen niet worden gewijzigd.';
  end if;

  if OLD.status = 'geannuleerd' then
    raise exception 'Een geannuleerde factuur kan niet meer worden gewijzigd.';
  end if;

  if NEW.status <> OLD.status then
    if not (toegestane_overgangen -> OLD.status) ? NEW.status then
      raise exception 'Statusovergang van "%" naar "%" is niet toegestaan.', OLD.status, NEW.status;
    end if;
    if NEW.factuurdatum <> OLD.factuurdatum or NEW.vervaldatum <> OLD.vervaldatum
       or NEW.subtotaal_excl_btw <> OLD.subtotaal_excl_btw or NEW.btw_bedrag <> OLD.btw_bedrag
       or NEW.totaal_incl_btw <> OLD.totaal_incl_btw or NEW.klant_snapshot <> OLD.klant_snapshot
       or NEW.regels <> OLD.regels or coalesce(NEW.notitie, '') <> coalesce(OLD.notitie, '') then
      raise exception 'Bij een statuswijziging kan de inhoud van de factuur niet tegelijk wijzigen.';
    end if;
  elsif OLD.status <> 'concept' then
    raise exception 'Een factuur met status "%" kan niet meer worden gewijzigd zonder statusovergang.', OLD.status;
  end if;

  NEW.updated_at := now();
  return NEW;
end;
$$;
create trigger facturen_bewaak_integriteit
before update on public.facturen
for each row execute function public.bewaak_factuur_integriteit();

-- ============================================================
-- RLS — volledig admin-only, exact hetzelfde patroon als offertes.
-- Geen enkele policy voor een klant, geen is_member_of_klant()-tak: de
-- hele Administratie-laag is bewust uitsluitend voor SMV/admin, geen
-- klanttoegang in deze versie (zie bouwprompt).
-- ============================================================

alter table public.facturen enable row level security;

create policy facturen_select_admin on public.facturen for select
  using (public.is_admin());
create policy facturen_insert_admin on public.facturen for insert
  with check (public.is_admin());
create policy facturen_update_admin on public.facturen for update
  using (public.is_admin())
  with check (public.is_admin());
-- Alleen een concept mag verwijderd worden — een verzonden/betaalde/
-- vervallen/geannuleerde factuur blijft altijd bewaard (audit-trail),
-- zelfde uitgangspunt als offertes_delete_admin_concept.
create policy facturen_delete_admin_concept on public.facturen for delete
  using (public.is_admin() and status = 'concept');
