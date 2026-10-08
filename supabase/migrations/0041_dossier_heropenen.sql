-- Dossier heropenen (2026-10-08) — tot nu toe blokkeerde
-- bewaak_dossier_integriteit() (0020_account_security_hardening.sql,
-- laatst herdefinieerd in 0031_klant_archief.sql) ELKE wijziging aan een
-- afgerond dossier onvoorwaardelijk, ook voor een admin: "if OLD.status =
-- 'afgerond' then raise exception" had geen uitzondering. Feature-verzoek:
-- een admin moet een afgerond dossier weer kunnen openen (bijv. een
-- verkeerd afgeronde of achteraf toch nog te wijzigen opname/advies), mits
-- met dubbele bevestiging in de UI (zie DossierDetail.jsx/
-- DossierVolgendeStap.jsx).
--
-- Oplossing: alleen voor een admin, en alleen als de ENIGE wijziging de
-- status zelf is (afgerond -> open) — geen enkele andere kolom mag in
-- dezelfde update meeliften. Een niet-admin blijft volledig geblokkeerd,
-- precies zoals voorheen. Zodra de status weer 'open' is, gelden de
-- bestaande regels verderop in deze functie gewoon weer (dus de klant kan
-- het dossier dan weer net als elk ander open dossier bewerken binnen de
-- eigen rechten).
create or replace function public.bewaak_dossier_integriteit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if OLD.status = 'afgerond' then
    if not public.is_admin() then
      raise exception 'Een afgerond Dossier kan niet meer worden gewijzigd.';
    end if;
    if NEW.status <> 'open'
       or NEW.klant_id <> OLD.klant_id
       or NEW.pand_id <> OLD.pand_id
       or coalesce(NEW.gearchiveerd_op, 'epoch'::timestamptz) <> coalesce(OLD.gearchiveerd_op, 'epoch'::timestamptz)
       or NEW.gearchiveerd_via_klant <> OLD.gearchiveerd_via_klant
       or coalesce(NEW.primaire_contactpersoon_id, '00000000-0000-0000-0000-000000000000'::uuid)
          <> coalesce(OLD.primaire_contactpersoon_id, '00000000-0000-0000-0000-000000000000'::uuid)
       or NEW.pand_snapshot is distinct from OLD.pand_snapshot
       or NEW.contactpersoon_snapshot is distinct from OLD.contactpersoon_snapshot
       or NEW.mjop_snapshot is distinct from OLD.mjop_snapshot
       or coalesce(NEW.pakket_id, '') <> coalesce(OLD.pakket_id, '')
       or NEW.bouwkundige_analyse is distinct from OLD.bouwkundige_analyse
    then
      raise exception 'Een afgerond Dossier kan uitsluitend worden heropend (status terug naar open) — daarbij mag verder niets anders wijzigen.';
    end if;
    return NEW;
  end if;

  if NEW.klant_id <> OLD.klant_id or NEW.pand_id <> OLD.pand_id then
    raise exception 'De klant- of pandkoppeling van een Dossier kan niet worden gewijzigd.';
  end if;

  if not public.is_admin() then
    if NEW.status <> OLD.status
       or coalesce(NEW.gearchiveerd_op, 'epoch'::timestamptz) <> coalesce(OLD.gearchiveerd_op, 'epoch'::timestamptz)
       or NEW.gearchiveerd_via_klant <> OLD.gearchiveerd_via_klant
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
