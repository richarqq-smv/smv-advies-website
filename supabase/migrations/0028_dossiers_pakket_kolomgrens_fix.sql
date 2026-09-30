-- Beveiligingsfix (ontdekt tijdens de live adversariële regressie van deze
-- ronde) — bewaak_dossier_integriteit() (0020_account_security_hardening.sql)
-- blijkt een EXPLICIETE lijst van beschermde kolommen te zijn (status/
-- gearchiveerd_op/primaire_contactpersoon_id/pand_snapshot/
-- contactpersoon_snapshot/mjop_snapshot), geen automatische "alles
-- behalve energie_snapshot is admin-only"-regel. De twee kolommen die
-- deze ronde zijn toegevoegd (`pakket_id`, 0025_dossiers_pakket_id.sql;
-- `bouwkundige_analyse`, 0027_dossiers_bouwkundige_analyse.sql) stonden
-- dus NIET in die lijst en waren daardoor, in tegenstelling tot wat de
-- moduledoc bij beide migraties aannam, gewoon door een niet-admin
-- klant op een eigen open dossier te wijzigen — bevestigd met een live
-- adversariële UPDATE-test.
--
-- Fix: beide kolommen toevoegen aan de bestaande deny-lijst. Admin
-- blijft ongewijzigd volledige toegang houden (de `if not is_admin()`-tak
-- verandert niet van vorm, alleen de voorwaarde erin wordt uitgebreid).
create or replace function public.bewaak_dossier_integriteit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if OLD.status = 'afgerond' then
    raise exception 'Een afgerond Dossier kan niet meer worden gewijzigd.';
  end if;
  if NEW.klant_id <> OLD.klant_id or NEW.pand_id <> OLD.pand_id then
    raise exception 'De klant- of pandkoppeling van een Dossier kan niet worden gewijzigd.';
  end if;

  if not public.is_admin() then
    if NEW.status <> OLD.status
       or coalesce(NEW.gearchiveerd_op, 'epoch'::timestamptz) <> coalesce(OLD.gearchiveerd_op, 'epoch'::timestamptz)
       or coalesce(NEW.primaire_contactpersoon_id, '00000000-0000-0000-0000-000000000000'::uuid)
          <> coalesce(OLD.primaire_contactpersoon_id, '00000000-0000-0000-0000-000000000000'::uuid)
       or NEW.pand_snapshot is distinct from OLD.pand_snapshot
       or NEW.contactpersoon_snapshot is distinct from OLD.contactpersoon_snapshot
       or NEW.mjop_snapshot is distinct from OLD.mjop_snapshot
       or coalesce(NEW.pakket_id, '') <> coalesce(OLD.pakket_id, '')
       or NEW.bouwkundige_analyse is distinct from OLD.bouwkundige_analyse
    then
      raise exception 'Deze wijziging aan het dossier is uitsluitend voor SMV beschikbaar.';
    end if;
  end if;

  return NEW;
end;
$$;
-- Trigger zelf (aangemaakt in 0001_init.sql) verwijst naar deze functie op
-- naam — een create or replace hierboven volstaat, geen create trigger nodig.
