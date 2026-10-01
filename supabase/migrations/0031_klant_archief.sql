-- Klant-archief (2026-10-01) — vervolg op 0010_dossier_archief.sql. Expliciete
-- productbeslissing: "klant naar archief" = de klant EN al zijn actieve
-- dossiers gaan tegelijk naar het archief (geen los, ongemerkt-inconsistent
-- "klant gearchiveerd maar dossiers nog actief"-tussenstaat). Geen hard
-- delete, geen cascade-delete — precies zoals bij dossiers: alleen een
-- datumveld erbij, niets wordt verwijderd.
--
-- `gearchiveerd_via_klant` op dossiers lost het herstel-ontwerpprobleem op:
-- als een klant met 3 dossiers wordt gearchiveerd (alle 3 cascade mee) en
-- daarna 1 dossier daarvan apart wordt hersteld, en vervolgens de klant
-- wordt hersteld, mag dat niet alsnog de andere 2 "zomaar" meesleuren met
-- een dubbele herstel-actie — en als een dossier al vóór de klant-
-- archivering apart gearchiveerd was, moet dat dossier gearchiveerd BLIJVEN
-- wanneer de klant later wordt hersteld (dat was nooit onderdeel van de
-- klant-archiveeractie). Vandaar: alleen dossiers die ECHT via de cascade
-- zijn gearchiveerd krijgen dit vlagje, en alleen die worden bij
-- klant-herstel weer teruggezet — nooit dossiers die om een eigen reden al
-- (niet) gearchiveerd waren.
alter table public.klanten add column gearchiveerd_op timestamptz;
alter table public.dossiers add column gearchiveerd_via_klant boolean not null default false;

-- Beveiliging, laag 1: `klanten_update` (0001_init.sql) staat een klant nu
-- al toe de EIGEN klantrij te updaten (zelf-service adresgegevens, zie
-- 0016_klanten_adres.sql) — zonder extra maatregel zou een klant dus via
-- een directe REST-call (buiten de UI om) zelf `gearchiveerd_op` kunnen
-- zetten. Zelfde tweelagen-aanpak als bewaak_dossier_integriteit/
-- bewaak_contactpersoon_integriteit: een eigen, smalle trigger die
-- uitsluitend deze ene kolom beschermt, geen nieuwe brede policy of
-- SECURITY DEFINER-functie.
create or replace function public.bewaak_klant_integriteit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_admin() then
    if coalesce(NEW.gearchiveerd_op, 'epoch'::timestamptz) <> coalesce(OLD.gearchiveerd_op, 'epoch'::timestamptz) then
      raise exception 'Deze wijziging aan de klant is uitsluitend voor SMV beschikbaar.';
    end if;
  end if;
  NEW.updated_at := now();
  return NEW;
end;
$$;
create trigger klanten_bewaak_integriteit
before update on public.klanten
for each row execute function public.bewaak_klant_integriteit();

-- Beveiliging, laag 2: dezelfde bescherming voor het nieuwe cascade-vlagje
-- op dossiers — toegevoegd aan de bestaande deny-lijst in
-- bewaak_dossier_integriteit() (0020_account_security_hardening.sql,
-- uitgebreid in 0028_dossiers_pakket_kolomgrens_fix.sql). Admin-tak
-- ongewijzigd.
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
