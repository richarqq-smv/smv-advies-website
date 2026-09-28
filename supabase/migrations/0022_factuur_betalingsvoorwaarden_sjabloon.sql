-- Vervolgronde op de factuursjabloon-ronde (2026-09-28) — de standaardtekst
-- van factuur_instellingen.betalingsvoorwaarden (0013_factuur_instellingen.sql)
-- week inhoudelijk af van het aangeleverde SMV-factuursjabloon. Deze
-- migratie past uitsluitend die ene tekst aan, letterlijk overgenomen uit
-- het sjabloon (word/document.xml, sectie "Betaalvoorwaarden") — geen
-- andere factuurvelden, geen KvK-nummer/IBAN (blijven bewust NULL, nog
-- onbekend), geen wijziging aan bestaande facturen (hun `regels`/
-- `klant_snapshot`/bedragen staan vast in de immutable snapshot, zie
-- 0014_facturen.sql — deze migratie raakt uitsluitend factuur_instellingen,
-- nooit de facturen-tabel zelf, dus bestaande facturen tonen bij het
-- opnieuw openen nog steeds exact dezelfde betalingsvoorwaarden-tekst die
-- destijds via de mailto/print-weergave is meegegeven; alleen een NIEUW
-- aangemaakte factuur leest voortaan deze nieuwe standaardtekst).
--
-- Kolom-DEFAULT wijzigen (voor een eventuele toekomstige reset/nieuwe
-- installatie) én de bestaande singleton-rij bijwerken — maar uitsluitend
-- als die rij nog de oorspronkelijke, nooit door een admin aangepaste
-- standaardtekst bevat (idempotent en niet-destructief: een admin die deze
-- tekst inmiddels zelf heeft aangepast via Instellingen wordt hier NIET
-- overschreven).
alter table public.factuur_instellingen
  alter column betalingsvoorwaarden set default
    'Wij verzoeken u het bovenstaande bedrag binnen 14 dagen na factuurdatum over te maken onder vermelding van het factuurnummer, conform artikel 4 van de Algemene Voorwaarden van SMV Advies (www.smv-advies.nl/voorwaarden).';

update public.factuur_instellingen
set betalingsvoorwaarden =
  'Wij verzoeken u het bovenstaande bedrag binnen 14 dagen na factuurdatum over te maken onder vermelding van het factuurnummer, conform artikel 4 van de Algemene Voorwaarden van SMV Advies (www.smv-advies.nl/voorwaarden).'
where id = 1
  and betalingsvoorwaarden = 'Wij verzoeken u het factuurbedrag binnen de gestelde betalingstermijn over te maken onder vermelding van het factuurnummer.';
