-- Offertes — commerciële snapshot van wat SMV Advies op een gegeven
-- moment aan een Klant heeft aangeboden voor een specifiek Pand/Dossier.
-- Hoort altijd bij een bestaande Klant + Pand + Dossier (geen losse
-- "offerte"-flow, zie DossierDetail → "Offerte maken"). V1 is bewust
-- admin-only: geen enkele policy hieronder staat een klant toe.
--
-- Zie OFFERTEARCHITECTUUR-audit: een offerte mag nooit met terugwerkende
-- kracht veranderen doordat klantdata, panddata, pakketdata of
-- voorwaarden later wijzigen — vandaar `snapshot jsonb`, dat op
-- aanmaakmoment een zelfstandige, volledige kopie vastlegt (zie
-- `snapshot`-kolomcommentaar hieronder). `klant_id`/`pand_id`/`dossier_id`
-- blijven wél relationele FK's — dat zijn identiteitsverwijzingen, geen
-- inhoud, exact hetzelfde onderscheid als `dossiers.klant_id` naast
-- `dossiers.pand_snapshot`.

create table public.offertes (
  id uuid primary key default gen_random_uuid(),

  klant_id uuid not null references public.klanten(klant_id) on delete restrict,
  pand_id uuid not null references public.panden(pand_id) on delete restrict,
  dossier_id uuid not null references public.dossiers(dossier_id) on delete restrict,

  -- Toegekend via een kolom-DEFAULT (zie genereer_offerte_nummer()
  -- hieronder) — nooit door de client bedacht of meegegeven, dus een
  -- niet-opgeslagen formulier verbruikt nooit een nummer, en gelijktijdige
  -- admin-sessies kunnen nooit hetzelfde nummer krijgen (nextval() is
  -- intrinsiek atomair in Postgres).
  offerte_nummer text not null unique,

  status text not null default 'concept' check (
    status in ('concept', 'verstuurd', 'geaccepteerd', 'afgewezen', 'geannuleerd')
  ),

  offerte_datum date not null default current_date,
  geldig_tot date not null,

  -- Komt overeen met de id's in src/data/packages.js ('basis'/'premium'/
  -- 'gold') — bewust geen FK naar een databasetabel: packages.js blijft
  -- voor V1 de bron van waarheid voor pakketinhoud (zie snapshot.pakket
  -- hieronder voor de vastgelegde inhoud van dát moment).
  pakket_id text not null check (pakket_id in ('basis', 'premium', 'gold')),

  -- Het concreet aangeboden bedrag — mag buiten de standaard bandbreedte
  -- van het pakket vallen (bewuste maatwerkkeuze door Richard); de
  -- applicatie waarschuwt hiervoor in de UI, blokkeert het niet.
  bedrag numeric(10, 2) not null check (bedrag >= 0),

  meerwerk jsonb not null default '[]'::jsonb check (jsonb_typeof(meerwerk) = 'array'),

  subtotaal numeric(10, 2) not null check (subtotaal >= 0),
  btw_percentage numeric(5, 2) not null check (btw_percentage >= 0),
  btw_bedrag numeric(10, 2) not null check (btw_bedrag >= 0),
  totaal numeric(10, 2) not null check (totaal >= 0),

  opmerkingen text,

  -- Zelfstandige momentopname: klant/contactpersoon/pand/pakket/financieel/
  -- voorwaardenversie zoals ze GOLDEN op het moment van opslaan — nooit
  -- een live verwijzing. Zie OffertePreview/offertes-datalaag voor de
  -- exacte vorm; op databaseniveau wordt alleen de minimale structurele
  -- garantie afgedwongen (een JSON-object, geen schemavalidatie — dat zou
  -- voor V1 overengineering zijn).
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),

  aangemaakt_door uuid not null default auth.uid() references auth.users(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint offertes_geldigheid_na_datum check (geldig_tot >= offerte_datum)
);

create index offertes_klant_idx on public.offertes (klant_id);
create index offertes_pand_idx on public.offertes (pand_id);
create index offertes_dossier_idx on public.offertes (dossier_id);

-- ============================================================
-- OFFERTENUMMERING
-- ============================================================
--
-- Eén doorlopende sequence (geen reset per jaar — zie audit sectie 11:
-- "SMV-OFF-2026-0003" gevolgd door "SMV-OFF-2027-0004" is het gevraagde
-- gedrag, niet een herstart naar 0001). Het jaartal in het nummer is
-- dus een cosmetisch prefix van het moment van aanmaken, niet gekoppeld
-- aan de sequence-telling zelf.
create sequence public.offerte_nummer_seq;

-- SECURITY DEFINER (zelfde patroon als is_admin()/registreer_klant()):
-- authenticated krijgt nooit rechtstreeks USAGE op de sequence, alleen
-- via deze functie, aangeroepen als kolom-DEFAULT bij het aanmaken van
-- een offerte. VOLATILE (default, geen `stable`-markering) — nextval()
-- heeft een neveneffect en mag dus niet als stable/immutable gemarkeerd
-- worden.
create or replace function public.genereer_offerte_nummer()
returns text
language sql
security definer
set search_path = ''
as $$
  select 'SMV-OFF-' || extract(year from now())::text || '-' || lpad(nextval('public.offerte_nummer_seq')::text, 4, '0');
$$;
revoke all on function public.genereer_offerte_nummer() from public, anon;
grant execute on function public.genereer_offerte_nummer() to authenticated;

alter table public.offertes alter column offerte_nummer set default public.genereer_offerte_nummer();

-- ============================================================
-- INTEGRITEIT: status-overgangen + bevriezing bij niet-concept
-- ============================================================
--
-- concept: vrij wijzigbaar (op de identiteitskoppeling na, zie hieronder).
-- concept -> verstuurd | geannuleerd
-- verstuurd -> geaccepteerd | afgewezen | geannuleerd
-- geaccepteerd | afgewezen | geannuleerd: volledig terminaal, ook de
-- status zelf wijzigt dan niet meer.
--
-- Bij een statusovergang mag de rest van de inhoud niet tegelijk
-- wijzigen (bevriest de offerte exact op het moment van versturen/
-- accepteren/etc.) — zelfde tweede, onafhankelijke beveiligingslaag
-- (naast RLS) als dossiers_bewaak_integriteit/adviespunten_bewaak_
-- integriteit in 0001_init.sql.
create or replace function public.bewaak_offerte_integriteit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  toegestane_overgangen jsonb := '{"concept": ["verstuurd", "geannuleerd"], "verstuurd": ["geaccepteerd", "afgewezen", "geannuleerd"]}'::jsonb;
begin
  if NEW.klant_id <> OLD.klant_id or NEW.pand_id <> OLD.pand_id or NEW.dossier_id <> OLD.dossier_id
     or NEW.offerte_nummer <> OLD.offerte_nummer then
    raise exception 'De klant-, pand- en dossierkoppeling en het offertenummer van een offerte kunnen niet worden gewijzigd.';
  end if;

  if OLD.status in ('geaccepteerd', 'afgewezen', 'geannuleerd') then
    raise exception 'Een offerte met status "%" kan niet meer worden gewijzigd.', OLD.status;
  end if;

  if NEW.status <> OLD.status then
    if not (toegestane_overgangen -> OLD.status) ? NEW.status then
      raise exception 'Statusovergang van "%" naar "%" is niet toegestaan.', OLD.status, NEW.status;
    end if;
    if NEW.offerte_datum <> OLD.offerte_datum or NEW.geldig_tot <> OLD.geldig_tot or NEW.pakket_id <> OLD.pakket_id
       or NEW.bedrag <> OLD.bedrag or NEW.meerwerk <> OLD.meerwerk or NEW.subtotaal <> OLD.subtotaal
       or NEW.btw_percentage <> OLD.btw_percentage or NEW.btw_bedrag <> OLD.btw_bedrag or NEW.totaal <> OLD.totaal
       or coalesce(NEW.opmerkingen, '') <> coalesce(OLD.opmerkingen, '') or NEW.snapshot <> OLD.snapshot then
      raise exception 'Bij een statuswijziging kan de inhoud van de offerte niet tegelijk wijzigen.';
    end if;
  elsif OLD.status <> 'concept' then
    raise exception 'Een offerte met status "%" kan niet meer worden gewijzigd.', OLD.status;
  end if;

  NEW.updated_at := now();
  return NEW;
end;
$$;
create trigger offertes_bewaak_integriteit
before update on public.offertes
for each row execute function public.bewaak_offerte_integriteit();

-- ============================================================
-- RLS — V1 is uitsluitend admin. Geen enkele policy voor een klant,
-- geen is_member_of_klant()-tak (in tegenstelling tot dossiers/
-- adviespunten) — bewuste, expliciete keuze, geen abstractie voor
-- toekomstige klanttoegang die V1 niet nodig heeft.
-- ============================================================

alter table public.offertes enable row level security;

create policy offertes_select_admin on public.offertes for select
  using (public.is_admin());
create policy offertes_insert_admin on public.offertes for insert
  with check (public.is_admin());
create policy offertes_update_admin on public.offertes for update
  using (public.is_admin())
  with check (public.is_admin());
-- Alleen concepten mogen verwijderd worden — een verstuurde/geaccepteerde/
-- afgewezen/geannuleerde offerte blijft altijd bewaard (audit-trail),
-- zelfde uitgangspunt als "geen destructieve acties op vastgelegde data"
-- elders in dit schema.
create policy offertes_delete_admin_concept on public.offertes for delete
  using (public.is_admin() and status = 'concept');
