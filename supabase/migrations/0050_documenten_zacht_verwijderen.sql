-- Klantreis-valkuilenronde (2026-10-15) — "Mijn documenten" verwijderde tot
-- nu toe écht onherstelbaar (hard delete, zowel het Storage-object als de
-- metadata-rij, zie verwijderDocument() in api.js/0018_documenten.sql).
-- Een klant die per ongeluk het verkeerde document bevestigt, had geen
-- enkele terugweg — in tegenstelling tot klanten/dossiers, die al langer
-- een archief/herstel-patroon hebben (0010_dossier_archief.sql,
-- 0031_klant_archief.sql). Dit past exact datzelfde patroon toe op
-- documenten: een nullable `..._op`-kolom, geen hard delete, geen
-- auto-purge.
--
-- `documenten` had tot nu toe BEWUST geen update-policy ("een document
-- wordt vervangen, niet bewerkt", zie 0018_documenten.sql) — dat blijft zo
-- voor de inhoud. De nieuwe policy hieronder staat alleen toe dat
-- `verwijderd_op` wordt gezet/teruggezet; de trigger bewaakt dat geen
-- enkele andere kolom via deze weg wijzigt, voor IEDEREEN inclusief admin
-- (geen is_admin()-uitzondering — dat zou de bestaande
-- inhoud-is-onveranderlijk-garantie alsnog doorbreken).
alter table public.documenten add column verwijderd_op timestamptz;

create policy documenten_update on public.documenten for update
  using (public.is_member_of_klant(klant_id) or public.is_admin())
  with check (public.is_member_of_klant(klant_id) or public.is_admin());

create or replace function public.bewaak_document_integriteit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if NEW.klant_id <> OLD.klant_id
     or coalesce(NEW.dossier_id, '00000000-0000-0000-0000-000000000000'::uuid) <> coalesce(OLD.dossier_id, '00000000-0000-0000-0000-000000000000'::uuid)
     or NEW.bestandsnaam <> OLD.bestandsnaam
     or NEW.storage_path <> OLD.storage_path
     or coalesce(NEW.omschrijving, '') <> coalesce(OLD.omschrijving, '')
     or coalesce(NEW.grootte_bytes, -1) <> coalesce(OLD.grootte_bytes, -1)
     or coalesce(NEW.content_type, '') <> coalesce(OLD.content_type, '')
     or NEW.geupload_door <> OLD.geupload_door
     or NEW.created_at <> OLD.created_at
  then
    raise exception 'Een document kan alleen verwijderd of hersteld worden, niet inhoudelijk bewerkt.';
  end if;
  return NEW;
end;
$$;
create trigger documenten_bewaak_integriteit
before update on public.documenten
for each row execute function public.bewaak_document_integriteit();
