-- Verificatieronde 2026-10-15, onderdeel B — bevriest SMV's eigen
-- bedrijfsgegevens (naam/adres/KVK/btw-id/IBAN/tenaamstelling/
-- betalingsvoorwaarden/e-mail/telefoon) op het moment dat een offerte of
-- factuur wordt aangemaakt, exact hetzelfde patroon als het al bestaande
-- `klant_snapshot`/`snapshot` (0005_offertes.sql/0014_facturen.sql).
--
-- Aanleiding: FactuurDocument.jsx/OfferteDocument.jsx lazen `instellingen`
-- altijd LIVE van `factuur_instellingen` (via getFactuurInstellingen() in
-- FactuurDetail.jsx/OffertePreview.jsx) — nooit bevroren. Het commentaar
-- bij 0022_factuur_betalingsvoorwaarden_sjabloon.sql ging er destijds al
-- vanuit dat "bestaande facturen bij het opnieuw openen nog steeds exact
-- dezelfde tekst tonen die destijds is meegegeven" — die aanname klopte
-- feitelijk niet (geen snapshot-kolom bestond), dus een latere wijziging
-- van bijvoorbeeld het IBAN zou met terugwerkende kracht op een allang
-- verstuurde, eerder aangemaakte factuur/offerte verschijnen bij
-- heropenen. Deze migratie maakt die altijd-al-bedoelde garantie waar.
--
-- Nullable, bewust: bestaande rijen (van vóór deze migratie) krijgen GEEN
-- met terugwerkende kracht verzonnen snapshot — er is geen betrouwbare
-- bron voor wat destijds daadwerkelijk in factuur_instellingen stond op
-- hún aanmaakmoment, en een slecht geraden snapshot zou feitelijk onjuiste
-- informatie als "zo was het toen" presenteren, erger dan eerlijk live
-- live tonen. Zie src/components/admin/FactuurDocument.jsx/OfferteDocument.jsx
-- voor de val-through-logica bij een lege snapshot (huidige `instellingen`,
-- exact het bestaande gedrag — geen regressie voor oude records).

alter table public.offertes
  add column bedrijfsgegevens_snapshot jsonb
    check (bedrijfsgegevens_snapshot is null or jsonb_typeof(bedrijfsgegevens_snapshot) = 'object');

alter table public.facturen
  add column bedrijfsgegevens_snapshot jsonb
    check (bedrijfsgegevens_snapshot is null or jsonb_typeof(bedrijfsgegevens_snapshot) = 'object');

-- Beide integriteitstriggers herschrijven zodat de nieuwe kolom óók
-- bevroren blijft tijdens een pure statusovergang (exact dezelfde regel
-- als klant_snapshot/snapshot/regels hierboven) — `is distinct from` i.p.v.
-- `<>`, want deze kolom is (bewust) nullable en `<>` met NULL aan een van
-- beide kanten levert in Postgres NULL op (dus stilzwijgend "geen
-- wijziging gedetecteerd"), wat een null->waarde- of waarde->null-wijziging
-- zou missen.
--
-- bewaak_offerte_integriteit() is ná 0005 nog een keer vervangen (door
-- 0009_offerte_verzonden_op.sql, die de verzonden_op-toekenning bij de
-- concept->verstuurd-overgang toevoegde) — deze create-or-replace bouwt
-- dus bewust op DIE laatste versie voort, niet op de oorspronkelijke uit
-- 0005, om die latere functionaliteit niet stilzwijgend ongedaan te maken.

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
       or coalesce(NEW.opmerkingen, '') <> coalesce(OLD.opmerkingen, '') or NEW.snapshot <> OLD.snapshot
       or NEW.bedrijfsgegevens_snapshot is distinct from OLD.bedrijfsgegevens_snapshot then
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

create or replace function public.bewaak_factuur_integriteit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  toegestane_overgangen jsonb := '{
    "concept": ["verzonden", "geannuleerd"],
    "verzonden": ["betaald", "vervallen", "geannuleerd"],
    "vervallen": ["betaald", "geannuleerd"],
    "betaald": ["verzonden"]
  }'::jsonb;
begin
  if NEW.klant_id <> OLD.klant_id
     or coalesce(NEW.dossier_id, '00000000-0000-0000-0000-000000000000'::uuid) <> coalesce(OLD.dossier_id, '00000000-0000-0000-0000-000000000000'::uuid)
     or coalesce(NEW.offerte_id, '00000000-0000-0000-0000-000000000000'::uuid) <> coalesce(OLD.offerte_id, '00000000-0000-0000-0000-000000000000'::uuid)
     or NEW.factuurnummer <> OLD.factuurnummer then
    raise exception 'De klant-, dossier- en offertekoppeling en het factuurnummer van een factuur kunnen niet worden gewijzigd.';
  end if;

  if OLD.status = 'geannuleerd' then
    raise exception 'Een geannuleerde factuur kan niet meer worden gewijzigd.';
  end if;

  if NEW.status <> OLD.status then
    if not (toegestane_overgangen -> OLD.status) ? NEW.status then
      raise exception 'Statusovergang van "%" naar "%" is niet toegestaan.', OLD.status, NEW.status;
    end if;
    if NEW.factuurdatum <> OLD.factuurdatum or NEW.vervaldatum <> OLD.vervaldatum
       or NEW.subtotaal_excl_btw <> OLD.subtotaal_excl_btw or NEW.btw_bedrag <> OLD.btw_bedrag
       or NEW.totaal_incl_btw <> OLD.totaal_incl_btw or NEW.klant_snapshot <> OLD.klant_snapshot
       or NEW.regels <> OLD.regels or coalesce(NEW.notitie, '') <> coalesce(OLD.notitie, '')
       or NEW.bedrijfsgegevens_snapshot is distinct from OLD.bedrijfsgegevens_snapshot then
      raise exception 'Bij een statuswijziging kan de inhoud van de factuur niet tegelijk wijzigen.';
    end if;
  elsif OLD.status <> 'concept' then
    raise exception 'Een factuur met status "%" kan niet meer worden gewijzigd zonder statusovergang.', OLD.status;
  end if;

  NEW.updated_at := now();
  return NEW;
end;
$$;
