-- Ronde 2026-10-16: admin_maak_klant_pand_dossier() (0043) eiste tot nu toe
-- verplicht een e-mailadres OF telefoonnummer voor de klant. Dat was zinvol
-- zolang er geen andere manier bestond om een net aangemaakte klant later
-- alsnog te bereiken. Sinds de koppelcode-eerst-aanmelding (0048
-- klant_koppelcode.sql, en de /inloggen → /registreren?koppelcode=1-flow)
-- kan de klant zelf, bij het koppelen van zijn account, zijn eigen
-- e-mailadres en telefoonnummer invullen (koppel_klant_met_code()'s
-- p_email/p_telefoon) — de admin hoeft dat dus niet meer vooraf te weten om
-- toch alvast een Klant + Pand + Dossier te kunnen aanmaken en een
-- koppelcode te genereren (admin_genereer_klant_koppelcode(), ook 0048).
--
-- Verwijdert uitsluitend die ene verplichting; de rest van de functie
-- (naamcontrole, is_admin()-gate, atomaire Klant+Pand+koppeling+Dossier-
-- aanmaak) blijft ongewijzigd — vandaar een volledige create or replace
-- van dezelfde functie-signatuur, geen nieuwe functie.
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
