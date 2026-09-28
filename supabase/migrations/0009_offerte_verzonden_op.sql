-- Werkfase Fase 10 (SMV-audit-opvolging, 2026-09-28): offerte-opvolging
-- praktisch maken. De audit/opdracht noemt "verzonden datum" expliciet als
-- minimaal benodigd veld naast status/geldig_tot (die al bestonden).
-- `updated_at` alleen volstaat niet: die verandert bij elke latere
-- statusovergang opnieuw (verstuurd -> geaccepteerd/afgewezen/geannuleerd),
-- dus het exacte verzendmoment zou daarmee overschreven raken zodra een
-- offerte verder in het proces komt.
alter table public.offertes add column verzonden_op timestamptz;

-- Vervangt bewaak_offerte_integriteit() (0005_offertes.sql) volledig —
-- zelfde patroon als 0003_fix_is_member_of_klant_recursion.sql: een nieuwe
-- migratie met `create or replace function`, nooit het oude bestand
-- wijzigen. Enige inhoudelijke toevoeging: bij EXACT de overgang
-- concept -> verstuurd wordt `verzonden_op` server-side (dus niet door de
-- client te vervalsen) op het huidige moment gezet — en nooit meer
-- overschreven bij latere overgangen (verstuurd -> geaccepteerd/afgewezen/
-- geannuleerd zijn geen "opnieuw versturen"). Alle bestaande regels
-- (toegestane overgangen, bevriezing van inhoud bij een statuswijziging,
-- volledige onwijzigbaarheid bij een terminale status) blijven identiek.
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
    if OLD.status = 'concept' and NEW.status = 'verstuurd' then
      NEW.verzonden_op := now();
    end if;
  elsif OLD.status <> 'concept' then
    raise exception 'Een offerte met status "%" kan niet meer worden gewijzigd.', OLD.status;
  end if;

  NEW.updated_at := now();
  return NEW;
end;
$$;
