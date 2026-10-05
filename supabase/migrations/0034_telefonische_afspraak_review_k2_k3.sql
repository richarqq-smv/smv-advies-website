-- Verwerkt bevinding K-2 en K-3 uit de onafhankelijke review van migratie
-- 0032 (telefonische afspraakplanner). K-1 (de klant/admin-race) is al
-- gesloten in migratie 0033; dit is een losse, gerichte vervolgmigratie
-- voor de twee resterende LOW-bevindingen, beide in dezelfde functie.
--
-- K-2 — security/IDOR-adjacent: "Dossier niet gevonden" (P0001) en "Niet
-- gemachtigd voor dit dossier" (42501) waren onderscheidbare
-- foutmeldingen, die verklappen of een dossier-ID bestaat (i.t.t. het
-- stille nul-rijen-patroon dat mijn_telefonische_afspraak zelf al
-- gebruikt). Samengevoegd tot één generieke melding/foutcode: een
-- aanvaller die willekeurige dossier-ID's probeert, krijgt nu in beide
-- gevallen exact dezelfde respons.
--
-- K-3 — productcompleetheid: niets verhinderde dat één dossier meerdere,
-- niet-overlappende telefonische afspraken kreeg. Toegevoegd: een
-- exists-check op een reeds bestaande gepland/afgerond-rij voor dit
-- dossier, vóór de insert. Bewust alleen deze twee statussen (niet
-- 'geannuleerd') — een geannuleerde afspraak mag opnieuw geboekt worden.
--
-- Geen wijziging aan de advisory lock/exclusion-constraint-aanpak uit
-- 0032/0033, geen RLS-wijziging, geen nieuwe parameters.
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
  -- 1+2: dossier bestaat en hoort aantoonbaar bij de ingelogde klant —
  -- één generieke melding voor "bestaat niet" én "is niet van jou" (K-2).
  select d.* into v_dossier from public.dossiers d where d.dossier_id = p_dossier_id;
  if not found or not public.is_member_of_klant(v_dossier.klant_id) then
    raise exception 'Dossier niet gevonden.' using errcode = 'P0001';
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

  -- K-3: dit dossier mag niet al een actieve telefonische afspraak hebben.
  if exists (
    select 1 from public.planning_afspraken pa
    where pa.dossier_id = p_dossier_id
      and pa.type = 'telefonisch_adviesgesprek'
      and pa.status in ('gepland', 'afgerond')
  ) then
    raise exception 'Voor dit dossier staat al een telefonisch adviesgesprek gepland.' using errcode = 'P0001';
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
  -- onderstaande check ooit een gat zou hebben); de datumgrendel-trigger
  -- uit 0033 dekt daarnaast ook de klant-vs-interne-blokkade-combinatie.
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
