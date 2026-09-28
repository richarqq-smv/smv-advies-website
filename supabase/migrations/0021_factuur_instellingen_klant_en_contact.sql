-- Factuursjabloon-ronde (2026-09-28) — aanleiding: het aangeleverde SMV-
-- factuursjabloon toont bedrijfs-e-mailadres en -telefoonnummer, die nog
-- geen kolom hebben op factuur_instellingen (0013_factuur_instellingen.sql
-- had alleen bedrijfsnaam/adres/postcode/plaats/kvk/btw-id/iban/
-- tenaamstelling/betalingsvoorwaarden). Geen nieuwe bron erbij (geen
-- data/company.js-hergebruik voor factuurdoeleinden — dat blijft bewust de
-- publieke-website-bron, zie 0013's eigen motivatie): dezelfde, al
-- bestaande centrale configuratietabel krijgt er twee kolommen bij, exact
-- hetzelfde patroon als de kolommen die er al staan.
--
-- Tweede, onafhankelijke bevinding tijdens het inspecteren van deze tabel
-- voor het sjabloon: FactuurDetail.jsx/api.js beweren (zie commentaar bij
-- FACTUUR_KOLOMMEN in api.js) dat een klant zijn eigen factuur kan bekijken
-- op /account/facturen/:id — maar getFactuurInstellingen() leest ONVOORWAAR-
-- DELIJK ook factuur_instellingen, en die tabel had tot nu toe uitsluitend
-- een admin-only SELECT-policy (0013). Voor een klant faalt die lezing dus
-- met "geen rijen" (RLS laat niets door), Promise.all in FactuurDetail.jsx
-- verwerpt daardoor, en de klant ziet "Deze factuur bestaat niet, of u
-- heeft er geen toegang toe" voor een factuur die hij wél mag inzien. Dit
-- is een vóór deze ronde al bestaande fout (ontstaan doordat de
-- klantomgeving-ronde na de Administratie-ronde kwam), die deze migratie
-- rechtzet met een tweede SELECT-policy: elke ingelogde gebruiker mag deze
-- ÉÉN rij lezen. Dat is veilig — de tabel bevat uitsluitend SMV's eigen,
-- niet-klantspecifieke bedrijfsgegevens (geen enkele kolom identificeert of
-- bevat gegevens van een klant), en een klant heeft de inhoud sowieso nodig
-- om zijn eigen factuur te kunnen betalen (IBAN/betalingsvoorwaarden staan
-- per definitie op elke factuur die een klant ontvangt). INSERT/UPDATE/
-- DELETE blijven onveranderd uitsluitend admin (0013's bestaande policies).

alter table public.factuur_instellingen
  add column email text,
  add column telefoon text;

-- Bekende, echte, reeds publieke waarden (identiek aan src/data/company.js,
-- en overeenkomstig geverifieerd met het aangeleverde factuursjabloon) —
-- geen verzonnen gegevens. kvk_nummer/btw_id/iban blijven bewust NULL: die
-- staan in het sjabloon zelf nog als placeholder ([KvK-nummer] e.d.), dus
-- zijn ook in werkelijkheid nog niet bekend; de admin vult ze zelf in via
-- Instellingen zodra ze bekend zijn.
update public.factuur_instellingen
set
  bedrijfsnaam = 'SMV Advies',
  adres = 'Frans Halsstraat 28',
  postcode = '3262 HG',
  plaats = 'Oud-Beijerland',
  email = 'info@smv-advies.nl',
  telefoon = '06 22 71 33 83'
where id = 1;

create policy factuur_instellingen_select_klant on public.factuur_instellingen for select
  using (auth.uid() is not null);
