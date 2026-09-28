-- Security-hardeningsronde (2026-09-28) — aanleiding: nu /account
-- daadwerkelijk klantmutaties ondersteunt, is met Read/Grep vastgesteld dat
-- twee bestaande, pre-existente RLS-oppervlakken breder waren dan bedoeld:
--
-- 1. dossiers_update (0001_init.sql) laat een klant op een eigen open
--    Dossier ELKE kolom wijzigen — in de praktijk alleen daadwerkelijk
--    gebruikt voor `energie_snapshot` (saveEnergieSnapshot(), aangeroepen
--    vanuit de publieke Energie-indicatiepagina/ResultsView.jsx), maar
--    RLS zelf trok geen grens rond die ene kolom. Erger: DossierWerkruimte.
--    jsx (components/klantOmgeving/) bleek GEEN enkele admin/klant-
--    onderscheid te maken — de "afronden"-knop en de "adviespunt
--    toevoegen/aanpassen/verwijderen"-acties werden voor iedereen getoond
--    en waren, via adviespunten_insert/update/delete (eveneens
--    0001_init.sql), ook voor een klant daadwerkelijk uitvoerbaar. Dat
--    is in directe tegenspraak met de bestaande SMV-regel "automatische
--    signalen zijn kandidaten, SMV bepaalt wat advies wordt".
--
-- 2. contactpersonen_update/contactpersonen_delete (0001_init.sql) golden
--    voor "elke contactpersoon van MIJN klant" (is_member_of_klant(klant_id))
--    in plaats van "uitsluitend mijn eigen rij" — bij een klant met meerdere
--    contactpersonen kon lid A daardoor lid B's account_id leegmaken
--    (WITH CHECK stond `account_id is null` altijd toe, ongeacht wiens rij)
--    of lid B's rij verwijderen, en daarmee diens inlogkoppeling met de
--    klant verbreken. Geen cross-tenant lek (blijft binnen dezelfde klant),
--    maar wel een "auth/user ownership wijzigen"-schending zoals deze ronde
--    expliciet uitsluit.
--
-- Dit bestand lost beide op met de kleinst mogelijke, bestaande patronen:
-- een uitgebreide integriteitstrigger (kolomgrens, naast de rijgrens die
-- RLS al trekt) en een versmalde policy — geen nieuwe tabel, geen nieuwe
-- RPC, geen herschreven geschiedenis. Admin behoudt overal volledige
-- toegang (is_admin()-tak blijft in elke policy/trigger bestaan).

-- ============================================================
-- 1. DOSSIERS — kolomgewijze klantbeperking
-- ============================================================
--
-- Een klant (niet-admin) mag op een eigen open Dossier voortaan
-- UITSLUITEND `energie_snapshot` wijzigen — de enige kolom die een
-- daadwerkelijk bestaand klant-schrijfpad heeft. Alle overige kolommen
-- (status, gearchiveerd_op, primaire_contactpersoon_id, pand_snapshot,
-- contactpersoon_snapshot, mjop_snapshot) worden read-only voor een klant,
-- ook al zou dossiers_update (RLS) de RIJ zelf toestaan — RLS bepaalt
-- welke rij, deze trigger bepaalt welke kolom. klant_id/pand_id blijven
-- zoals voorheen voor IEDEREEN immutable (die check stond er al).
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
    then
      raise exception 'Deze wijziging aan het dossier is uitsluitend voor SMV beschikbaar.';
    end if;
  end if;

  return NEW;
end;
$$;
-- Trigger zelf (aangemaakt in 0001_init.sql) verwijst naar deze functie op
-- naam — een create or replace hierboven volstaat, geen create trigger nodig.

-- ============================================================
-- 2. ADVIESPUNTEN — voortaan volledig admin-only voor mutaties
-- ============================================================
--
-- SELECT blijft ongewijzigd (een klant mag eigen adviesinformatie blijven
-- lezen — dat is al zo sinds 0001_init.sql en wordt hier niet aangepast).
-- INSERT/UPDATE/DELETE verliezen de klant-tak: alleen SMV mag een
-- automatisch signaal omzetten naar, of een bestaand adviespunt wijzigen
-- als, definitief advies. Zelfde admin-only-vorm als dossier_commerciele_
-- kansen/planning_afspraken (0011/0012).
drop policy if exists adviespunten_insert on public.adviespunten;
create policy adviespunten_insert on public.adviespunten for insert
  with check (public.is_admin());

drop policy if exists adviespunten_update on public.adviespunten;
create policy adviespunten_update on public.adviespunten for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists adviespunten_delete on public.adviespunten;
create policy adviespunten_delete on public.adviespunten for delete
  using (public.is_admin());

-- ============================================================
-- 3. CONTACTPERSONEN — uitsluitend de eigen rij, nooit account_id wijzigen
-- ============================================================
--
-- Was: "elke contactpersoon van mijn klant" (is_member_of_klant(klant_id)).
-- Wordt: "uitsluitend mijn eigen, aan mijn account gekoppelde rij"
-- (account_id = auth.uid()) — een klant kan daardoor nooit meer een
-- collega-contactpersoon binnen dezelfde klant aanraken. is_member_of_klant
-- blijft in de WITH CHECK staan als extra, overbodige-maar-onschadelijke
-- laag (klant_id verandert toch nooit, zie de trigger hieronder).
drop policy if exists contactpersonen_update on public.contactpersonen;
create policy contactpersonen_update on public.contactpersonen for update
  using (account_id = auth.uid() or public.is_admin())
  with check (public.is_admin() or (
    public.is_member_of_klant(klant_id) and account_id = auth.uid()
  ));

drop policy if exists contactpersonen_delete on public.contactpersonen;
create policy contactpersonen_delete on public.contactpersonen for delete
  using (account_id = auth.uid() or public.is_admin());

-- Trigger als tweede, onafhankelijke laag (zelfde filosofie als
-- bewaak_dossier_integriteit/bewaak_offerte_integriteit/bewaak_factuur_
-- integriteit): zelfs een toekomstige, per ongeluk te ruime policy-
-- wijziging kan hierdoor account_id/klant_id niet meer laten muteren
-- door een niet-admin. account_id mag wél van null naar de eigen uid
-- (zelf-koppelen aan een reeds bestaande, nog ongekoppelde rij van de
-- eigen klant blijft mogelijk — geen bestaand gebruik, maar geen reden om
-- dat extra te blokkeren zolang het altijd de eigen uid blijft).
create or replace function public.bewaak_contactpersoon_integriteit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_admin() then
    if NEW.klant_id <> OLD.klant_id then
      raise exception 'De klantkoppeling van een contactpersoon kan niet worden gewijzigd.';
    end if;
    if coalesce(NEW.account_id, '00000000-0000-0000-0000-000000000000'::uuid)
       <> coalesce(OLD.account_id, '00000000-0000-0000-0000-000000000000'::uuid)
       and NEW.account_id is distinct from auth.uid() then
      raise exception 'De accountkoppeling van een contactpersoon kan uitsluitend naar het eigen account worden gewijzigd.';
    end if;
  end if;
  NEW.updated_at := now();
  return NEW;
end;
$$;
create trigger contactpersonen_bewaak_integriteit
before update on public.contactpersonen
for each row execute function public.bewaak_contactpersoon_integriteit();
