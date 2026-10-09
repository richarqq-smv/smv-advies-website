-- Doelgroep "zakelijk" (EIA/MIA/Vamil-uitbreidingsronde, 2026-10-09) —
-- 0039_dossier_subsidie_specificaties_uitbreiding.sql beperkte doelgroep
-- tot ('eigenaar_bewoner', 'vve', 'overig'), uitsluitend geschreven met
-- ISDE (woningeigenaren) in gedachten. Sindsdien bestaat er ook een
-- EIA/MIA/Vamil-koppeling (fiscaleKoppeling.js) die specifiek voor
-- zakelijke panden is onderzocht — het ontbrak tot nu toe aan een eerlijke
-- doelgroepwaarde om dat vast te leggen, waardoor een zakelijk pand
-- (bijv. een horecazaak) standaard als "eigenaar_bewoner" werd behandeld,
-- wat feitelijk onjuist is (ISDE in deze engine is onderzocht voor
-- woningeigenaren, zie isdeIsolatieRegels.js). Alleen de toegestane
-- waarden worden uitgebreid; bestaande rijen/gedrag blijven ongewijzigd.
alter table public.dossier_subsidie_specificaties drop constraint dossier_subsidie_specificaties_doelgroep_check;
alter table public.dossier_subsidie_specificaties add constraint dossier_subsidie_specificaties_doelgroep_check
  check (doelgroep in ('eigenaar_bewoner', 'vve', 'overig', 'zakelijk'));

comment on column public.dossier_subsidie_specificaties.doelgroep is 'eigenaar_bewoner (ISDE, geïmplementeerd) / vve of overig (SVVE/SVOH, nog niet geïmplementeerd) / zakelijk (zakelijk pand/ondernemer — ISDE niet van toepassing, zie i.p.v. daarvan de EIA/MIA/Vamil-sectie) — engine toont bij elke afwijking van eigenaar_bewoner bewust Controle vereist.';
