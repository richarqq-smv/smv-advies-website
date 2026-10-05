-- Telefonische-afspraakplanner voor zakelijke panden (werkfase 2026-10-05)
-- — uitbreiding van de BESTAANDE planning_afspraken (0011_admin_planning.sql),
-- geen nieuwe tabel. Zie het onderzoeksrapport eerder in deze sessie voor de
-- volledige architectuurafweging; dit bestand voert uitsluitend de daar
-- vastgestelde minimale wijzigingen door.
--
-- Ontwerpbeslissingen, kort:
-- 1) `type` krijgt één nieuwe waarde (`telefonisch_adviesgesprek`) — geen
--    nieuwe tabel, geen nieuwe kolom voor "is dit een blokkade": een
--    interne blokkade is en blijft gewoon een planning_afspraken-rij met
--    een ander `type` (bijv. 'overig'), precies zoals vóór deze migratie al
--    het geval was. De beschikbaarheidsberekening behandelt elk bestaand
--    type als bezet (type-agnostisch), dus daar hoeft niets voor te
--    veranderen.
-- 2) GEEN nieuwe RLS-policy op planning_afspraken zelf. Alle klanttoegang
--    loopt uitsluitend via drie SECURITY DEFINER-functies hieronder, die
--    zelf autoriseren (is_member_of_klant + dossier/pand-eigendom) en
--    nooit méér dan de noodzakelijke, veilige velden teruglevert. De vier
--    bestaande admin-only policies (0011) blijven volledig ongewijzigd —
--    dit is dus letterlijk "RLS niet versoepeld": er is geen enkele nieuwe
--    rij toegankelijk via RLS zelf, alleen via functies die zelf, per
--    aanroep, hun eigen smalle autorisatie afdwingen.
-- 3) EXCLUDE-constraint is bewust NIET globaal. Onderzoek van de bestaande
--    code (planning.js/api.js: valideerAfspraak/createAfspraak/
--    updateAfspraak) bevestigt dat er vóór deze migratie generiek GEEN
--    overlap-check bestaat — admin kan vandaag al bewust of per ongeluk
--    overlappende interne afspraken aanmaken, en niets in de bestaande
--    architectuur verbiedt dat. Een globale exclusion constraint zou dat
--    bestaande, altijd-toegestane gedrag met terugwerkende kracht breken.
--    De constraint hieronder is daarom een PARTIAL exclusion constraint:
--    alleen rijen van het NIEUWE type `telefonisch_adviesgesprek` mogen
--    onderling nooit overlappen (dat is exact het scenario uit §11: twee
--    klanten die tegelijk hetzelfde moment boeken) — interne afspraken van
--    andere types blijven, zoals voorheen, vrij om elkaar te overlappen.
--    De (zeldzamere) klant-vs-admin-race — een klant boekt op het exacte
--    moment dat admin onafhankelijk een overlappende interne blokkade
--    aanmaakt — wordt afgedekt door `boek_telefonische_afspraak()` zelf via
--    een transactiegebonden advisory lock + expliciete overlap-check tegen
--    ALLE types, zie die functie hieronder.
-- 4) Geen nieuwe extensie nodig: de exclusion constraint gebruikt één
--    enkele `tsrange`-expressie (datum+tijd samengevoegd tot een kale,
--    tz-loze timestamp — zelfde lokale-tijd-benadering als de rest van de
--    app, zie §13) met het ingebouwde GiST-operatorsupport van Postgres'
--    eigen rangetypes. `btree_gist` is alleen nodig zodra een exclusion
--    constraint een scalaire kolom (`WITH =`) combineert met een range in
--    dezelfde GiST-index — dat doet deze constraint niet.

alter table public.planning_afspraken drop constraint if exists planning_afspraken_type_check;
alter table public.planning_afspraken add constraint planning_afspraken_type_check check (type in (
  'kennismaking', 'bedrijfsbezoek', 'adviesgesprek', 'offertebespreking',
  'overleg', 'herbeoordeling', 'overig', 'telefonisch_adviesgesprek'
));

-- Half-open interval [starttijd, eindtijd) per §20 — `'[)'` maakt dat
-- expliciet, in plaats van op de (ook correcte) Postgres-standaarddefault
-- te leunen, zodat dit niet per ongeluk verandert bij een toekomstige
-- rangetype-wijziging elders.
alter table public.planning_afspraken
  add constraint telefonisch_adviesgesprek_geen_overlap
  exclude using gist (
    tsrange((datum + starttijd)::timestamp, (datum + eindtijd)::timestamp, '[)') with &&
  )
  where (type = 'telefonisch_adviesgesprek' and status <> 'geannuleerd');

-- ============================================================
-- beschikbare_momenten(datum) — smalle, klantgerichte leesroute (§6/§23)
-- ============================================================
-- SECURITY DEFINER is hier noodzakelijk: een klant heeft, en krijgt via
-- deze migratie ook niet, enig rechtstreeks SELECT-recht op
-- planning_afspraken (zie ontwerpbeslissing 2 hierboven) — zonder
-- verhoogd recht zou de interne EXISTS-query hieronder altijd 0 rijen
-- zien en dus alles als "vrij" rapporteren. De functie zelf levert
-- uitsluitend een lijst starttijden terug — geen klant-/dossier-/
-- notitiegegevens van de onderliggende rijen, nooit de reden van een
-- blokkade (§6).
--
-- Rekenkern bewust identiek aan de pure JS-logica in
-- src/lib/klantOmgeving/afspraakBeschikbaarheid.js
-- (berekenBeschikbareStarttijden): zelfde vast plannervenster (08:00-
-- 17:30 laatste start), zelfde 10-minutenstap, zelfde 30-minutenduur,
-- zelfde half-open-overlaptoets. Beide implementaties moeten bij een
-- toekomstige wijziging van deze regels SAMEN worden aangepast — zie het
-- eindrapport, "Open punten".
create or replace function public.beschikbare_momenten(p_datum date)
returns table (starttijd time)
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_slot time := time '08:00';
  v_eindtijd time;
  v_vandaag date := current_date;
  v_nu time := current_time;
begin
  if p_datum is null or p_datum < v_vandaag then
    return;
  end if;

  while v_slot <= time '17:30' loop
    v_eindtijd := v_slot + interval '30 minutes';
    if not (p_datum = v_vandaag and v_slot < v_nu) and not exists (
      select 1 from public.planning_afspraken pa
      where pa.datum = p_datum
        and pa.status <> 'geannuleerd'
        and pa.starttijd < v_eindtijd
        and pa.eindtijd > v_slot
    ) then
      starttijd := v_slot;
      return next;
    end if;
    v_slot := v_slot + interval '10 minutes';
  end loop;
end;
$$;
revoke all on function public.beschikbare_momenten(date) from public, anon;
grant execute on function public.beschikbare_momenten(date) to authenticated;

-- ============================================================
-- mijn_telefonische_afspraak(dossier_id) — eigen afspraak lezen (§8/§23)
-- ============================================================
-- Zelfde SECURITY DEFINER-reden als hierboven. Autoriseert zelf via
-- is_member_of_klant() op het klant_id van het gevraagde dossier — exact
-- hetzelfde ownership-patroon als dossiers_select/dossiers_update
-- (0001_init.sql). Geeft nooit rijen van een ander dossier terug, en
-- nooit het `notitie`-veld (dat bestaat voor dit type ook functioneel
-- niet — de boekings-RPC zet het nooit — maar wordt ook hier simpelweg
-- niet geselecteerd, als extra, expliciete garantie).
create or replace function public.mijn_telefonische_afspraak(p_dossier_id uuid)
returns table (afspraak_id uuid, datum date, starttijd time, eindtijd time, status text)
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_klant_id uuid;
begin
  select d.klant_id into v_klant_id from public.dossiers d where d.dossier_id = p_dossier_id;
  if v_klant_id is null or not public.is_member_of_klant(v_klant_id) then
    return;
  end if;

  return query
    select pa.afspraak_id, pa.datum, pa.starttijd, pa.eindtijd, pa.status
    from public.planning_afspraken pa
    where pa.dossier_id = p_dossier_id
      and pa.type = 'telefonisch_adviesgesprek'
      and pa.status <> 'geannuleerd'
    order by pa.datum desc, pa.starttijd desc;
end;
$$;
revoke all on function public.mijn_telefonische_afspraak(uuid) from public, anon;
grant execute on function public.mijn_telefonische_afspraak(uuid) to authenticated;

-- ============================================================
-- boek_telefonische_afspraak(dossier_id, datum, starttijd) — §9/§24
-- ============================================================
-- Voert zelf, server-side, alle 11 controles uit die de opdracht
-- benoemt. De client kan nooit klant_id/status/type/eindtijd/notitie
-- meegeven — die worden hier, en uitsluitend hier, bepaald.
--
-- Zakelijk-gate (§2/§26): panden.gebruikstype is vóór deze migratie een
-- vrije tekstkolom zonder CHECK-constraint — de bestaande MJOP-tool
-- (BUILDING_USE_OPTIONS) en de energie-indicatietool (PANDTYPE_OPTIONS)
-- bieden sámen uitsluitend de onderstaande zakelijke waarden aan, en er
-- bestaat nergens in de huidige UI een pad om een andere waarde op te
-- slaan. Omdat die garantie tot nu toe uitsluitend uit frontend-discipline
-- bestond (geen DB-garantie) en de aanwezige productiedata vanuit deze
-- omgeving niet te verifiëren is (zie §26: "voeg geen constraint toe die
-- bestaande geldige data breekt"), is een retroactieve CHECK-constraint op
-- de gedeelde `panden`-tabel zelf NIET toegevoegd — dat zou bestaande,
-- mogelijk afwijkende rijen kunnen breken zonder dat hier geverifieerd kon
-- worden of die bestaan. In plaats daarvan staat de allowlist hier, lokaal
-- in deze nieuwe functie: een nieuwe, geïsoleerde controle die niets aan
-- bestaande rijen/functionaliteit kan breken, en die de boeking weigert
-- zodra het pandtype niet op de bekende zakelijke lijst staat. Zie het
-- eindrapport voor de volledige afweging en het openstaande punt.
create or replace function public.boek_telefonische_afspraak(p_dossier_id uuid, p_datum date, p_starttijd time)
returns table (afspraak_id uuid, datum date, starttijd time, eindtijd time, status text, type text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dossier record;
  v_pand record;
  v_eindtijd time;
  v_vandaag date := current_date;
  v_nu time := current_time;
  v_nieuwe_afspraak_id uuid;
begin
  -- 1+2: dossier bestaat en hoort aantoonbaar bij de ingelogde klant
  select d.* into v_dossier from public.dossiers d where d.dossier_id = p_dossier_id;
  if not found then
    raise exception 'Dossier niet gevonden.' using errcode = 'P0001';
  end if;
  if not public.is_member_of_klant(v_dossier.klant_id) then
    raise exception 'Niet gemachtigd voor dit dossier.' using errcode = '42501';
  end if;

  -- 3+4: gekoppeld pand bestaat en is zakelijk (zie toelichting hierboven)
  select p.* into v_pand from public.panden p where p.pand_id = v_dossier.pand_id;
  if not found then
    raise exception 'Pand niet gevonden.' using errcode = 'P0001';
  end if;
  if v_pand.gebruikstype is null or v_pand.gebruikstype not in (
    'kantoor', 'bedrijfshal', 'winkel', 'horeca', 'praktijk', 'gemengd', 'anders',
    'magazijn', 'werkplaats', 'overig'
  ) then
    raise exception 'Deze planner is uitsluitend beschikbaar voor zakelijke panden.' using errcode = 'P0001';
  end if;

  -- 5: datum geldig (vandaag of later)
  if p_datum is null or p_datum < v_vandaag then
    raise exception 'Ongeldige datum.' using errcode = 'P0001';
  end if;

  -- 6+7+8: starttijd binnen het plannervenster, op een 10-minutenstap,
  -- zodat een vol blok van 30 minuten altijd binnen 08:00-18:00 past
  -- (laatste toegestane start is dus 17:30).
  if p_starttijd is null
     or p_starttijd < time '08:00'
     or p_starttijd > time '17:30'
     or extract(minute from p_starttijd)::int % 10 <> 0
     or extract(second from p_starttijd)::int <> 0
  then
    raise exception 'Ongeldige starttijd.' using errcode = 'P0001';
  end if;
  if p_datum = v_vandaag and p_starttijd < v_nu then
    raise exception 'Deze starttijd ligt in het verleden.' using errcode = 'P0001';
  end if;
  v_eindtijd := p_starttijd + interval '30 minutes';

  -- Seriegrendel per datum: READ COMMITTED (Postgres-standaard) ziet het
  -- werk van een nog niet gecommitte, gelijktijdige transactie niet — een
  -- kale "check dan insert" is daarmee alléén onvoldoende tegen een
  -- race. De exclusion constraint hierboven is de uiteindelijke garantie
  -- voor twee telefonische boekingen die elkaar overlappen (zelfs als
  -- onderstaande check ooit een gat zou hebben), maar dekt per ontwerp
  -- niet de klant-vs-interne-blokkade-combinatie (§11 vs §12) — deze lock
  -- + de overlapcheck hieronder (die WEL alle types meeweegt) dekken dat.
  perform pg_advisory_xact_lock(hashtext(p_datum::text));

  -- 9: geen overlap met ENIGE bestaande rij op die datum, van welk type
  -- dan ook (§7: interne blokkades tellen gewoon mee als bezet).
  if exists (
    select 1 from public.planning_afspraken pa
    where pa.datum = p_datum
      and pa.status <> 'geannuleerd'
      and pa.starttijd < v_eindtijd
      and pa.eindtijd > p_starttijd
  ) then
    raise exception 'Dit moment is net niet meer beschikbaar.' using errcode = '23P01';
  end if;

  -- 10+11: vast type en server-side afgeleide klant-/dossierkoppeling —
  -- nooit uit een clientparameter.
  insert into public.planning_afspraken (klant_id, dossier_id, onderwerp, type, datum, starttijd, eindtijd, status)
  values (v_dossier.klant_id, p_dossier_id, 'Telefonisch adviesgesprek', 'telefonisch_adviesgesprek', p_datum, p_starttijd, v_eindtijd, 'gepland')
  returning public.planning_afspraken.afspraak_id into v_nieuwe_afspraak_id;

  return query
    select pa.afspraak_id, pa.datum, pa.starttijd, pa.eindtijd, pa.status, pa.type
    from public.planning_afspraken pa
    where pa.afspraak_id = v_nieuwe_afspraak_id;
exception
  when exclusion_violation then
    raise exception 'Dit moment is net niet meer beschikbaar.' using errcode = '23P01';
end;
$$;
revoke all on function public.boek_telefonische_afspraak(uuid, date, time) from public, anon;
grant execute on function public.boek_telefonische_afspraak(uuid, date, time) to authenticated;
