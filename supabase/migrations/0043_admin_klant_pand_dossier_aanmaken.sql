-- Admin-UX-ronde (2026-10-09, UX-auditrapport §0): tot nu toe bestond er
-- GEEN manier voor een admin om zelf een Klant/Pand/Dossier aan te maken —
-- elk Dossier ontstond uitsluitend via de klant zelf (registreer_klant()/
-- maak_pand_en_koppel(), beide SECURITY DEFINER op auth.uid() van de
-- aanroeper, zie 0001_init.sql). Een admin heeft geen auth.uid() dat bij
-- de nieuwe klant hoort, dus die twee bestaande RPC's zijn hier niet
-- herbruikbaar (maak_pand_en_koppel() roept is_member_of_klant() aan, wat
-- voor een zojuist aangemaakte klant zonder account altijd false is).
--
-- Deze functie is het admin-equivalent: atomair Klant + Pand +
-- Klant-Pand-koppeling + Dossier in één transactie, zodat er nooit een
-- gedeeltelijk aangemaakte combinatie kan ontstaan (zelfde architectuur-
-- motivatie als maak_pand_en_koppel() voor Pand+koppeling). Admin-gated
-- via is_admin() binnen de functie zelf (SECURITY DEFINER, dus de RLS
-- van de aanroeper zelf wordt hier bewust overgeslagen — exact zoals de
-- bestaande SECURITY DEFINER-functies in 0001_init.sql, zie de inventaris
-- in SECURITY_MODEL.md).
--
-- pand_snapshot is NOT NULL op dossiers (0001_init.sql) — deze functie
-- bouwt die snapshot op dezelfde manier als openOfHergebruikDossier()
-- in lib/klantOmgeving/api.js (JS), zodat beide paden identieke
-- snapshot-vorm opleveren.
--
-- Maakt bewust GEEN contactpersoon aan: dat is niet gevraagd en zou een
-- nieuwe keuze zijn (koppelen aan een toekomstig account) die niet uit de
-- bestaande architectuur volgt. dossiers.primaire_contactpersoon_id blijft
-- null, net als bij een rechtstreekse adminImporteerKlant()-import zonder
-- contactpersonen. Een latere zelfregistratie-koppeling van deze klant aan
-- een echt account is in de huidige architectuur niet geautomatiseerd
-- (registreer_klant() maakt altijd een NIEUWE klant aan, geen koppeling
-- aan een bestaande) — zie SMV-eindrapport, "resterende beperkingen".
create or replace function public.admin_maak_klant_pand_dossier(
  p_klant jsonb,
  p_pand jsonb,
  p_pakket_id text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_klant_id uuid;
  v_pand_id uuid;
  v_dossier_id uuid;
  v_pand_snapshot jsonb;
begin
  if not public.is_admin() then
    raise exception 'Alleen een admin kan een klant/pand/dossier aanmaken.';
  end if;

  if coalesce(trim(p_klant->>'naam'), '') = '' then
    raise exception 'Naam van de klant is verplicht.';
  end if;
  if coalesce(trim(p_klant->>'email'), '') = '' and coalesce(trim(p_klant->>'telefoon'), '') = '' then
    raise exception 'Vul een e-mailadres of telefoonnummer in voor de klant.';
  end if;

  insert into public.klanten (naam, bedrijfsnaam, email, telefoon)
  values (p_klant->>'naam', p_klant->>'bedrijfsnaam', p_klant->>'email', p_klant->>'telefoon')
  returning klant_id into v_klant_id;

  insert into public.panden (
    omschrijving, adres, postcode, plaats, bouwjaar, gebruikstype, vloeroppervlak,
    bouwlagen, gebruikers, energiebron, verwarmingssysteem_type, energielabel,
    opmerkingen, ontstaan_via
  ) values (
    p_pand->>'omschrijving', p_pand->>'adres', p_pand->>'postcode', p_pand->>'plaats',
    (p_pand->>'bouwjaar')::int, p_pand->>'gebruikstype', (p_pand->>'vloeroppervlak')::numeric,
    (p_pand->>'bouwlagen')::int, (p_pand->>'gebruikers')::int, p_pand->>'energiebron',
    p_pand->>'verwarmingssysteemType', p_pand->>'energielabel', p_pand->>'opmerkingen',
    coalesce(p_pand->>'ontstaanVia', 'intake')
  ) returning pand_id into v_pand_id;

  insert into public.klant_pand_relaties (klant_id, pand_id) values (v_klant_id, v_pand_id);

  -- Zelfde vorm als pandSnapshot in openOfHergebruikDossier() (api.js).
  v_pand_snapshot := jsonb_build_object(
    'bouwjaar', (p_pand->>'bouwjaar')::int,
    'gebruikstype', p_pand->>'gebruikstype',
    'vloeroppervlak', (p_pand->>'vloeroppervlak')::numeric,
    'bouwlagen', (p_pand->>'bouwlagen')::int,
    'gebruikers', (p_pand->>'gebruikers')::int,
    'energiebron', p_pand->>'energiebron',
    'verwarmingssysteemType', p_pand->>'verwarmingssysteemType',
    'energielabel', p_pand->>'energielabel'
  );

  insert into public.dossiers (klant_id, pand_id, pand_snapshot, pakket_id)
  values (v_klant_id, v_pand_id, v_pand_snapshot, p_pakket_id)
  returning dossier_id into v_dossier_id;

  return v_dossier_id;
end;
$$;

revoke all on function public.admin_maak_klant_pand_dossier(jsonb, jsonb, text) from public, anon;
grant execute on function public.admin_maak_klant_pand_dossier(jsonb, jsonb, text) to authenticated;
