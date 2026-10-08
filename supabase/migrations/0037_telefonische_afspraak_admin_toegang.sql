-- Bugfix: telefonische-afspraakplanner (TelefonischeAfspraakSectie.jsx)
-- faalde met de generieke "Boeken is niet gelukt. Probeer het opnieuw."
-- zodra een ADMIN de planner gebruikte via /admin/dossiers/:id (DossierDetail
-- wordt zowel klant- als admin-zijdig gerouteerd, zie dossierNavigatie.js).
--
-- Oorzaak: boek_telefonische_afspraak() en mijn_telefonische_afspraak()
-- (0032, laatst herzien in 0034) autoriseren uitsluitend via
-- is_member_of_klant() — zonder de is_admin()-fallback die verder overal
-- in dit project consequent wordt gebruikt voor klant-eigen resources
-- (zie public.dossiers/offertes/facturen/documenten-policies in
-- 0001_init.sql en 0018_documenten.sql: steeds
-- "is_member_of_klant(klant_id) or is_admin()"). Een admin is per
-- definitie geen lid van de klant, dus faalde de autorisatiecheck en kwam
-- de generieke catch-all-foutmelding in api.js naar boven i.p.v. de echte
-- (verborgen) oorzaak.
--
-- Fix: exact dezelfde, al overal gebruikte OR-voorwaarde toevoegen aan
-- beide functies. Verder functioneel ONGEWIJZIGD — dezelfde K-2/K-3-
-- aanpassingen uit 0034, dezelfde foutmeldingen/errcodes, dezelfde
-- advisory lock/overlapcontrole, dezelfde generieke
-- "Dossier niet gevonden"-melding voor zowel "bestaat niet" als "is niet
-- van jou/je klant" (die generieke-meldingregel blijft onaangetast; een
-- admin die een niet-bestaand dossier probeert krijgt nog steeds exact
-- diezelfde melding, alleen is "is lid van de klant OF is admin" nu de
-- voorwaarde die bepaalt of het dossier als "van jou" telt).
--
-- beschikbare_momenten() hoeft niet aangepast: die functie is al
-- dossier-/klant-onafhankelijk en voor elke ingelogde gebruiker
-- (authenticated) toegankelijk.
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
  if v_klant_id is null or not (public.is_member_of_klant(v_klant_id) or public.is_admin()) then
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
  -- 1+2: dossier bestaat en hoort aantoonbaar bij de ingelogde klant, óf de
  -- aanroeper is admin — één generieke melding voor "bestaat niet" en "is
  -- niet van jou/je klant" (K-2, ongewijzigd).
  select d.* into v_dossier from public.dossiers d where d.dossier_id = p_dossier_id;
  if not found or not (public.is_member_of_klant(v_dossier.klant_id) or public.is_admin()) then
    raise exception 'Dossier niet gevonden.' using errcode = 'P0001';
  end if;

  -- 3+4: gekoppeld pand bestaat en is zakelijk
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

  -- 6+7+8: starttijd binnen het plannervenster, op een 10-minutenstap
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

  -- Seriegrendel per datum (ongewijzigd t.o.v. 0032/0033/0034)
  perform pg_advisory_xact_lock(hashtext(p_datum::text));

  -- 9: geen overlap met ENIGE bestaande rij op die datum, van welk type dan ook
  if exists (
    select 1 from public.planning_afspraken pa
    where pa.datum = p_datum
      and pa.status <> 'geannuleerd'
      and pa.starttijd < v_eindtijd
      and pa.eindtijd > p_starttijd
  ) then
    raise exception 'Dit moment is net niet meer beschikbaar.' using errcode = '23P01';
  end if;

  -- 10+11: vast type en server-side afgeleide klant-/dossierkoppeling
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
