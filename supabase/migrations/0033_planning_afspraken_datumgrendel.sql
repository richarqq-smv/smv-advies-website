-- Sluit bevinding K-1 uit de onafhankelijke review van migratie 0032: de
-- advisory lock in boek_telefonische_afspraak() serialiseerde alleen
-- aanroepers die zelf diezelfde lock opvroegen. Het admin-pad
-- (createAfspraak/updateAfspraak in src/lib/klantOmgeving/api.js) is een
-- kale PostgREST-insert zonder lock — een admin-insert kon dus, in een
-- venster van enkele milliseconden tijdens de transactie van een klant,
-- ongemerkt een overlappende interne afspraak toevoegen (de partial
-- exclusion constraint uit 0032 raakt dat niet: die geldt alleen tussen
-- rijen van het type 'telefonisch_adviesgesprek' onderling).
--
-- Minimale, tabel-brede oplossing i.p.v. het aanpassen van elk insert-pad
-- afzonderlijk: een BEFORE INSERT-trigger die, ongeacht de herkomst van de
-- insert (klant-RPC, admin/PostgREST, of een toekomstig insert-pad),
-- dezelfde pg_advisory_xact_lock(hashtext(datum::text)) opvraagt als
-- boek_telefonische_afspraak() al deed. Omdat dit precies dezelfde lock-
-- sleutel is (hash van de datum), worden alle inserts op dezelfde datum nu
-- altijd geserialiseerd, ongeacht het pad — de klant-RPC neemt hem nog
-- steeds zelf ook (onschadelijk dubbel: xact-locks zijn binnen één
-- transactie reentrant en worden samen bij commit/rollback vrijgegeven),
-- maar is daar niet langer de ENIGE plek waar dat gebeurt.
--
-- Bewust NIET op UPDATE: de gerapporteerde race is specifiek INSERT-vs-
-- INSERT (een klant die boekt terwijl admin een nieuwe interne afspraak
-- *toevoegt*); UPDATE van een bestaande rij naar een nieuwe, overlappende
-- tijd is een ander, hier niet gevraagd scenario (zie het reviewrapport,
-- "geen brede refactor"). Wat ongewijzigd blijft: interne afspraken mogen
-- elkaar onderling nog steeds overlappen (de trigger serialiseert alleen
-- de VOLGORDE van inserts op dezelfde datum, hij weigert nooit een insert
-- en voegt geen eigen overlapcheck toe — die blijft uitsluitend bestaan in
-- boek_telefonische_afspraak() voor telefonische boekingen). Geen RLS-,
-- grant- of exclusion-constraint-wijziging.
--
-- Zelfde conventie als de bestaande triggers (bewaak_dossier_integriteit/
-- bewaak_opname_integriteit, zie 0001_init.sql/0030_...sql): plpgsql,
-- search_path = '', geen SECURITY DEFINER nodig (triggers lopen al binnen
-- de transactiecontext van de aanroepende insert, en hoeven — anders dan
-- de RPC's — geen RLS te omzeilen; pg_advisory_xact_lock is bovendien een
-- ingebouwde pg_catalog-functie, voor iedere rol aanroepbaar).
create or replace function public.vergrendel_planning_afspraken_datum()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext(NEW.datum::text));
  return NEW;
end;
$$;

create trigger planning_afspraken_vergrendel_datum
before insert on public.planning_afspraken
for each row execute function public.vergrendel_planning_afspraken_datum();
