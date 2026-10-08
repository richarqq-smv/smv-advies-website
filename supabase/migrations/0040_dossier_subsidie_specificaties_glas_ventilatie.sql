-- Gerichte inhoudelijke uitbreidingsronde (2026-10-08) — na hercontrole
-- van de officiële RVO-bronnen zijn glasisolatie (HR++/triple) en
-- ventilatie wél betrouwbaar te implementeren (meerdere onafhankelijke
-- RVO-meldcodepagina's bevestigen identieke bedragen, zie
-- isdeIsolatieRegels.js en isdeVentilatieRegel.js) — in de vorige ronde
-- bewust nog niet toegevoegd omdat alleen tegensprekende commerciële
-- bronnen waren gevonden. Zelfde patroon als 0039: alleen de toegestane
-- maatregel_key-waarden uitbreiden, geen nieuwe kolommen nodig (glas
-- gebruikt oppervlakte_m2/technische_waarde net als de bestaande
-- isolatiematen; ventilatie gebruikt alleen meldcode/isolatie_bevestigd/
-- uitvoeringsjaar, net als een apparaatmaatregel).
alter table public.dossier_subsidie_specificaties
  drop constraint dossier_subsidie_specificaties_maatregel_key_check;
alter table public.dossier_subsidie_specificaties
  add constraint dossier_subsidie_specificaties_maatregel_key_check
  check (maatregel_key in (
    'dakisolatie', 'gevelisolatie', 'vloerisolatie', 'bodemisolatie',
    'glasHrpp', 'glasTriple', 'ventilatie',
    'warmtepomp_hybride', 'warmtepomp_elektrisch', 'zonneboiler'
  ));
