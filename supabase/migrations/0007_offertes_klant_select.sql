-- Werkfase Fase 3 (SMV-audit-opvolging, 2026-09-28): een klant mag zijn
-- eigen offerte read-only bekijken (prijs, geldigheid, voorwaarden, pakket,
-- Gold-scope) — de audit had vastgesteld dat offertes tot nu toe volledig
-- admin-only waren, ook voor de eigen klant.
--
-- Bewust een MINIMALE, additieve policy: alleen SELECT, alleen voor de
-- klant die via is_member_of_klant() (0001_init.sql) al bij deze offerte
-- hoort — exact hetzelfde patroon als offertes_select_admin hieronder en
-- als dossiers_select/adviespunten_select in 0001_init.sql. Geen INSERT/
-- UPDATE/DELETE-rechten voor een klant: die blijven uitsluitend admin
-- (offertes_insert_admin/offertes_update_admin/offertes_delete_admin_concept,
-- 0005_offertes.sql) — een klant kan een offerte dus nooit wijzigen,
-- de status manipuleren, of verwijderen. "OR is_admin()" is niet nodig:
-- offertes_select_admin blijft ongewijzigd naast deze policy bestaan,
-- Postgres RLS combineert meerdere permissieve policies met OR.
create policy offertes_select_klant on public.offertes for select
  using (public.is_member_of_klant(klant_id));
