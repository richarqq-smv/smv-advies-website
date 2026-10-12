-- Correctie op 0045_dossier_nummer.sql (zelfde dag) — genereer_dossier_
-- nummer() kreeg per ongeluk dezelfde is_admin()-poortwachter als
-- genereer_offerte_nummer()/genereer_factuur_nummer(). Dat klopt daar
-- omdat offertes/facturen volledig admin-only zijn (RLS staat een klant
-- daar nooit toe iets in te zetten — de admin-check voorkomt alleen
-- "verspilde" nummers bij een rechtstreekse RPC-aanroep buiten de app om,
-- zie 0023_nummergenerator_admin_only.sql).
--
-- Voor dossiers ligt dat anders: dossiers_insert (0001_init.sql) laat een
-- GEWONE KLANT al decennialang zelf een Dossier aanmaken (de publieke
-- MJOP-Tool/energie-indicatieflow, zie openOfHergebruikDossier() in
-- api.js — geen admin-aanroep). Met de is_admin()-check in de kolom-
-- DEFAULT zou elke klant-geïnitieerde dossier-insert vanaf nu hard falen
-- op "Alleen SMV kan een dossiernummer genereren." — live bevestigd via
-- een adversariële test met een niet-admin sessie. De echte
-- beveiligingsgrens voor "wie mag een dossier aanmaken" is en blijft de
-- dossiers_insert-RLS-policy zelf; de nummergenerator hoeft dat niet
-- nogmaals te controleren.
create or replace function public.genereer_dossier_nummer()
returns text
language sql
security definer
set search_path = ''
as $$
  select 'SMV-DOS-' || extract(year from now())::text || '-' || lpad(nextval('public.dossier_nummer_seq')::text, 4, '0');
$$;
-- Grants ongewijzigd (al sinds 0045 revoked van public/anon, authenticated
-- behoudt EXECUTE — nodig voor zowel de admin- als de klant-insertflow).
