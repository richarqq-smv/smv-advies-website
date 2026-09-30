-- Digitale opnameflow — inhoud (2026-09-30) — vervolg op 0029_opnames.sql,
-- nu de klant de originele brondocumenten heeft aangeleverd:
--   - "SMV Advies Checklist Locatiebezoek" — een procescheckist van 38
--     losse ☐-items over 6 fasen (Voorbereiding/Bouwkundig/Installaties/
--     Verbruik & documenten/Foto's/Afronding). Fase "Afronding" bevat
--     letterlijk het item "Checklist volledig ingevuld en gearchiveerd
--     bij het project" — dat item is dus zelf de brondocument-eigen
--     definitie van "compleet", vandaar de compleetheidsregel hieronder.
--   - "SMV Advies Opnameformulier Locatiebezoek" — de echte
--     data-invoerstructuur: 17 vaste onderdelen (Dak t/m Energieverbruik,
--     letterlijk de ONDERDEEL-codes uit het formulier zelf), elk met
--     0..N waarnemingsregels (het sjabloon heeft zelf 2 lege voorbeeld-
--     regels per onderdeel — dus bewust geen "1 tekstveld per onderdeel",
--     zie opname_waarnemingen hieronder) van telkens dezelfde 7 kolommen:
--     Huidige situatie / Beoordeling / Maatvoering / Aandachtspunt /
--     Mogelijke maatregel / Foto nr. / Opmerkingen.
--
-- Architectuurkeuze, zelfde overweging als dossier_taken (0026): de 38
-- checklist-items zijn VASTE, nooit door een gebruiker bewerkte tekst —
-- dat hoort als data in code (src/lib/klantOmgeving/opnameChecklist.js),
-- niet als een aparte Postgres-referentietabel. Deze migratie bewaart
-- UITSLUITEND de per-opname afvink-status, met een check-constraint die
-- de toegestane codes vastzet op precies deze 38 (zelfde soort vaste-set-
-- check-constraint als dossier_taken.categorie) — dat voorkomt willekeurige
-- vrije tekst in een kolom die eigenlijk een vaste enumeratie is, zonder
-- een aparte lookup-tabel te bouwen voor content die nooit verandert.
--
-- "Foto nr." uit het opnameformulier is INHOUDELIJK vervangen, niet
-- weggelaten: op papier was dat een handmatig ingetypt kruisverwijzing-
-- nummer naar een los genummerd fotobestand (zie het
-- fotonummeringssysteem in het formulier). In de app koppelt een foto
-- rechtstreeks aan de waarneming via documenten.opname_waarneming_id
-- hieronder — de inspecteur hoeft dus geen nummer meer te typen of te
-- onthouden, de koppeling is al structureel gelegd. Zie eindrapport voor
-- de expliciete toelichting van deze keuze.
--
-- "Maatvoering" blijft één vrij tekstveld: de brondocumenten splitsen dit
-- nergens in een apart waarde/eenheid/metingtype (geen kolommen daarvoor
-- in het formulier) — een gestructureerd metingmodel zou hier dus pure
-- gok zijn (expliciet verboden, zie opdracht §25). Vastgelegd als open
-- punt in het eindrapport, niet stilzwijgend zelf ingevuld.

-- ============================================================
-- CHECKLIST-VOORTGANG (procescheckist, 1 rij per aangevinkt/ontvinkt item)
-- ============================================================
create table public.opname_checklist_items (
  id uuid primary key default gen_random_uuid(),
  opname_id uuid not null references public.opnames(opname_id) on delete cascade,
  item_code text not null check (item_code in (
    'voorbereiding_1', 'voorbereiding_2', 'voorbereiding_3', 'voorbereiding_4', 'voorbereiding_5',
    'bouwkundig_1', 'bouwkundig_2', 'bouwkundig_3', 'bouwkundig_4', 'bouwkundig_5', 'bouwkundig_6', 'bouwkundig_7', 'bouwkundig_8',
    'installaties_1', 'installaties_2', 'installaties_3', 'installaties_4', 'installaties_5', 'installaties_6', 'installaties_7', 'installaties_8',
    'verbruik_1', 'verbruik_2', 'verbruik_3', 'verbruik_4', 'verbruik_5',
    'fotos_1', 'fotos_2', 'fotos_3', 'fotos_4', 'fotos_5', 'fotos_6', 'fotos_7',
    'afronding_1', 'afronding_2', 'afronding_3', 'afronding_4', 'afronding_5'
  )),
  afgevinkt boolean not null default false,
  afgevinkt_op timestamptz,
  updated_at timestamptz not null default now(),
  unique (opname_id, item_code)
);

-- ============================================================
-- WAARNEMINGEN (het opnameformulier: onderdeel -> N waarnemingsregels)
-- ============================================================
create table public.opname_waarnemingen (
  waarneming_id uuid primary key default gen_random_uuid(),
  opname_id uuid not null references public.opnames(opname_id) on delete cascade,
  onderdeel text not null check (onderdeel in (
    'dak', 'gevel', 'vloer', 'glas', 'kozijnen', 'deuren', 'isolatie', 'kierdichting',
    'cv', 'warmtepomp', 'warmtapwater', 'ventilatie', 'verlichting', 'zonnepanelen',
    'meterkast', 'overig', 'verbruik'
  )),
  huidige_situatie text,
  beoordeling text,
  maatvoering text,
  aandachtspunt text,
  mogelijke_maatregel text,
  opmerkingen text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index opname_waarnemingen_opname_idx on public.opname_waarnemingen (opname_id);
create index opname_waarnemingen_onderdeel_idx on public.opname_waarnemingen (opname_id, onderdeel);

-- ============================================================
-- DOCUMENTEN — foto/bijlage optioneel koppelen aan een specifieke
-- waarneming (naast de al bestaande documenten.opname_id uit 0029, die
-- opname-breed blijft werken voor foto's zonder specifiek onderdeel).
-- ============================================================
alter table public.documenten
  add column opname_waarneming_id uuid references public.opname_waarnemingen(waarneming_id) on delete set null;
create index documenten_opname_waarneming_idx on public.documenten (opname_waarneming_id);

-- ============================================================
-- INTEGRITEIT — "afgerond" is echt afgerond (opdracht §22): een concept/
-- opgeslagen opname blijft vrij bewerkbaar, een afgeronde opname niet meer
-- — stilzwijgend, zonder eerst expliciet te heropenen (status terug naar
-- 'opgeslagen'/'concept', waarvoor geen aparte trigger nodig is: dat is
-- gewoon een normale UPDATE op opnames.status, hieronder expliciet
-- toegestaan). Zelfde patroon als bewaak_dossier_integriteit/
-- bewaak_adviespunt_integriteit in 0001_init.sql.
create or replace function public.bewaak_opname_integriteit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if OLD.status = 'afgerond' and NEW.status = 'afgerond' then
    if NEW.opname_datum is distinct from OLD.opname_datum
       or NEW.notitie is distinct from OLD.notitie
       or NEW.dossier_id is distinct from OLD.dossier_id
       or NEW.planning_afspraak_id is distinct from OLD.planning_afspraak_id then
      raise exception 'Een afgeronde opname kan niet worden gewijzigd. Heropen de opname eerst.';
    end if;
  end if;
  return NEW;
end;
$$;
create trigger opnames_bewaak_integriteit
before update on public.opnames
for each row execute function public.bewaak_opname_integriteit();

-- Gedeelde guard voor beide inhoudstabellen: beide hebben een opname_id-
-- kolom, dus dezelfde functie werkt voor allebei (zelfde hergebruik-
-- overweging als de rest van deze codebase — geen twee bijna-identieke
-- triggerfuncties).
create or replace function public.bewaak_opname_inhoud_integriteit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_status text;
  v_opname_id uuid := coalesce(NEW.opname_id, OLD.opname_id);
begin
  select status into v_status from public.opnames where opname_id = v_opname_id;
  if v_status = 'afgerond' then
    raise exception 'Deze opname is afgerond en kan niet meer worden gewijzigd. Heropen de opname eerst.';
  end if;
  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$;
create trigger opname_waarnemingen_bewaak_integriteit
before insert or update or delete on public.opname_waarnemingen
for each row execute function public.bewaak_opname_inhoud_integriteit();
create trigger opname_checklist_items_bewaak_integriteit
before insert or update or delete on public.opname_checklist_items
for each row execute function public.bewaak_opname_inhoud_integriteit();

-- ============================================================
-- RLS — zelfde admin-only 4-policy patroon als opnames zelf (0029): dit
-- is inspecteurswerk, geen klantgericht scherm (zie opdracht §13).
-- ============================================================
alter table public.opname_checklist_items enable row level security;
alter table public.opname_waarnemingen enable row level security;

create policy opname_checklist_items_select_admin on public.opname_checklist_items for select
  using (public.is_admin());
create policy opname_checklist_items_insert_admin on public.opname_checklist_items for insert
  with check (public.is_admin());
create policy opname_checklist_items_update_admin on public.opname_checklist_items for update
  using (public.is_admin())
  with check (public.is_admin());
create policy opname_checklist_items_delete_admin on public.opname_checklist_items for delete
  using (public.is_admin());

create policy opname_waarnemingen_select_admin on public.opname_waarnemingen for select
  using (public.is_admin());
create policy opname_waarnemingen_insert_admin on public.opname_waarnemingen for insert
  with check (public.is_admin());
create policy opname_waarnemingen_update_admin on public.opname_waarnemingen for update
  using (public.is_admin())
  with check (public.is_admin());
create policy opname_waarnemingen_delete_admin on public.opname_waarnemingen for delete
  using (public.is_admin());
