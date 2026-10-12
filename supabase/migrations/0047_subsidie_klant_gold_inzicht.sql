-- Implementatieronde 2026-10-12, punt 2: Gold-klanten hadden nergens
-- inzicht in hun eigen subsidiebegeleiding — dossier_subsidies en
-- dossier_taken (categorie 'subsidie') waren tot nu toe 100% admin-only,
-- ook voor de eigen klant. Dit voegt uitsluitend twee MINIMALE, additieve
-- SELECT-policies toe (exact het patroon van offertes_select_klant,
-- 0007_offertes_klant_select.sql) — geen INSERT/UPDATE/DELETE voor een
-- klant, dus een Gold-klant kan nooit iets in deze tabellen wijzigen.
--
-- Bewust NIET uitgebreid naar dossier_subsidie_specificaties of
-- rvo_subsidie_index: dat is de technische ISDE/EIA-invoer en de interne
-- RVO-referentielijst (AdminSubsidieBegeleiding.jsx/SubsidieCheck.jsx),
-- geen "eigen gegevens van de klant" maar intern SMV-adviesgereedschap —
-- zie 0038_dossier_subsidie_specificaties.sql, ongewijzigd.
--
-- dossier_taken: de policy hieronder is bewust beperkt tot
-- `categorie = 'subsidie'` (niet 'oplevering') — exact wat gevraagd is,
-- en precies de "bewuste SELECT-policy-uitbreiding" die het commentaar in
-- 0026_dossier_taken.sql al aankondigde voor dit scenario.
--
-- Pakket (Gold) bepaalt hier bewust NIET mee in RLS: net als
-- dossiers_select/adviespunten_select ziet een klant altijd zijn eigen
-- dossierdata, ongeacht pakket — "pakket is UI-zichtbaarheid, geen
-- datamodel-/RLS-grens" (zie lib/klantOmgeving/pakketArchitectuurBroncontrole.test.js
-- en de moduledoc in dossierHealthCheck.js). De Gold-gate zit dus in
-- DossierDetail.jsx (isAdmin || dossier.pakket_id === 'gold'), niet hier.

create policy dossier_subsidies_select_klant on public.dossier_subsidies for select
  using (exists (select 1 from public.dossiers d where d.dossier_id = dossier_subsidies.dossier_id and public.is_member_of_klant(d.klant_id)));

create policy dossier_taken_select_klant_subsidie on public.dossier_taken for select
  using (
    categorie = 'subsidie'
    and exists (select 1 from public.dossiers d where d.dossier_id = dossier_taken.dossier_id and public.is_member_of_klant(d.klant_id))
  );
