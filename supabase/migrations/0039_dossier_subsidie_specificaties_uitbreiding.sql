-- Subsidiehulp-uitbreiding (2026-10-08) — breidt dossier_subsidie_
-- specificaties (0038) uit van alleen dak-/gevelisolatie naar de volledige
-- inhoudelijke scope van deze ronde: vloerisolatie, bodemisolatie (zelfde
-- oppervlakte/Rd-tariefmechanisme als dak/gevel) én de nieuwe
-- apparaatmaatregelen (hybride/elektrische warmtepomp, zonneboiler), die
-- geen uniform €/eenheid-tarief kennen maar een vast, per geregistreerd
-- product gepubliceerd RVO-bedrag (zie src/lib/subsidie/isdeApparaatRegels.js
-- — geen formule verzonnen, de adviseur neemt het bedrag en de bron-URL
-- rechtstreeks over van de officiële meldcodepagina van dát apparaat).
--
-- Bewust GEEN nieuwe tabel: dit is dezelfde "technische brongegevens per
-- maatregel"-rol als 0038 al had, nu met twee kleine, generieke
-- toevoegingen (bedrag/bron_url) die zowel voor isolatie als voor
-- apparaten zinvol zijn (bedrag: bij isolatie blijft dit null, de engine
-- berekent dat uit oppervlakte x tarief; bij apparaten is dit het enige
-- bedrag dat er is). "doelgroep" maakt het in opdracht §2/§13 vereiste
-- onderscheid eigenaar-bewoner/VvE/overig expliciet en controleerbaar,
-- zonder een SVVE/SVOH-tarieventabel te verzinnen die niet betrouwbaar is
-- vastgesteld (de engine toont bij een afwijkende doelgroep bewust
-- "Controle vereist", zie subsidieEligibility.js).
--
-- isolatie_bevestigd wordt bewust NIET hernoemd: de kolom blijft bestaan
-- en wordt voor apparaatmaatregelen hergebruikt met dezelfde ja/nee/
-- onbekend-betekenis ("is deze maatregel daadwerkelijk uitgevoerd/
-- aangebracht?") — een nieuwe, vrijwel identieke kolom zou pure
-- duplicatie zijn (opdracht: "geen onnodige duplicatie").
alter table public.dossier_subsidie_specificaties
  drop constraint dossier_subsidie_specificaties_maatregel_key_check;
alter table public.dossier_subsidie_specificaties
  add constraint dossier_subsidie_specificaties_maatregel_key_check
  check (maatregel_key in (
    'dakisolatie', 'gevelisolatie', 'vloerisolatie', 'bodemisolatie',
    'warmtepomp_hybride', 'warmtepomp_elektrisch', 'zonneboiler'
  ));

alter table public.dossier_subsidie_specificaties
  add column bedrag numeric(10, 2) check (bedrag is null or bedrag >= 0),
  add column bron_url text,
  add column doelgroep text not null default 'eigenaar_bewoner'
    check (doelgroep in ('eigenaar_bewoner', 'vve', 'overig'));

comment on column public.dossier_subsidie_specificaties.bedrag is 'Alleen voor apparaatmaatregelen: het vaste subsidiebedrag van de officiële meldcodepagina van het specifieke apparaat — nooit berekend/gegokt.';
comment on column public.dossier_subsidie_specificaties.bron_url is 'Alleen voor apparaatmaatregelen: de officiële RVO-meldcodepagina-URL waar bedrag/meldcode op gecontroleerd zijn.';
comment on column public.dossier_subsidie_specificaties.doelgroep is 'eigenaar_bewoner (ISDE, geïmplementeerd) / vve of overig (SVVE/SVOH, nog niet geïmplementeerd — engine toont Controle vereist).';

-- RLS blijft ongewijzigd (admin-only, 4 bestaande policies op tabelniveau
-- gelden automatisch ook voor deze nieuwe kolommen — geen kolom-specifieke
-- policy nodig in Postgres RLS, maar live geverifieerd in deze ronde).
