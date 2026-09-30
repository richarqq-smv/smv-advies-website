-- Adviesrapport-ronde — aanleiding: alle drie de rapporttemplates (Basis/
-- Premium/Gold) bevatten een universele "Maatregelen: investering,
-- besparing en terugverdientijd"-tabel met een prioriteitskolom (1-3).
-- Voor een adviespunt met herkomst 'energie' staat die informatie al
-- bevroren in signaal_bevroren (besparingEuro/investeringLaag/
-- investeringHoog/terugverdientijd, zie 0001_init.sql/adviespunt.js) —
-- maar voor herkomst 'mjop'/'handmatig' bestaat nergens een structureel
-- veld, alleen de vrije toelichting-tekst. Zonder dit veld kan de
-- maatregelentabel nooit automatisch gevuld worden voor een MJOP-
-- signaal of een handmatig adviespunt, wat de tabel voor twee van de
-- drie herkomsten volledig handmatig zou houden.
--
-- Alle vijf kolommen zijn NULLABLE en hebben geen default: een adviespunt
-- als "geen actie nodig" of "onvoldoende informatie" blijft volledig
-- geldig zonder ze in te vullen (zie createAdviespunt() in
-- lib/dossier/adviespunt.js — dat blijft ongewijzigd, dit zijn puur
-- optionele aanvullingen bovenop de bestaande verplichte velden).
--
-- Geen RLS-wijziging nodig: adviespunten_select/insert/update/delete
-- (0001_init.sql, aangescherpt in 0020_account_security_hardening.sql)
-- werken al op rijniveau, niet op kolomniveau — dezelfde policies dekken
-- deze nieuwe kolommen automatisch mee, met dezelfde admin-only-mutatie-
-- grens als de bestaande velden.
alter table public.adviespunten
  add column investering_laag numeric(10, 2) check (investering_laag is null or investering_laag >= 0),
  add column investering_hoog numeric(10, 2) check (investering_hoog is null or investering_hoog >= 0),
  add column besparing_euro numeric(10, 2) check (besparing_euro is null or besparing_euro >= 0),
  add column terugverdientijd_jaren numeric(5, 1) check (terugverdientijd_jaren is null or terugverdientijd_jaren >= 0),
  add column prioriteit smallint check (prioriteit is null or prioriteit between 1 and 3);

comment on column public.adviespunten.investering_laag is 'Optionele indicatie, excl. btw — ondergrens van een bandbreedte, of het enige bedrag als er geen bandbreedte is. Nooit automatisch afgeleid/geschat.';
comment on column public.adviespunten.investering_hoog is 'Optionele indicatie, excl. btw — bovengrens van een bandbreedte. Leeg als investering_laag al een vast bedrag is.';
comment on column public.adviespunten.besparing_euro is 'Optionele geschatte besparing per jaar, indicatie.';
comment on column public.adviespunten.terugverdientijd_jaren is 'Optionele geschatte terugverdientijd in jaren, indicatie.';
comment on column public.adviespunten.prioriteit is '1 (hoogste) t/m 3 (laagste) — matcht de "Prioriteit (1-3)"-kolom in de rapporttemplates. Optioneel, nooit automatisch bepaald.';
