-- Klantomgeving-uitbreiding (2026-09-28) — "Mijn facturen" op /account:
-- exact hetzelfde patroon als offertes_select_klant (0007_offertes_klant_
-- select.sql): een minimale, additieve SELECT-policy voor de klant die via
-- is_member_of_klant() al bij deze factuur hoort. Geen INSERT/UPDATE/
-- DELETE voor een klant — die blijven uitsluitend admin (facturen_insert_
-- admin/facturen_update_admin/facturen_delete_admin_concept, 0014_facturen.
-- sql), dus een klant kan een factuur nooit wijzigen, de status manipuleren
-- of verwijderen. "OR is_admin()" is niet nodig: facturen_select_admin
-- blijft ongewijzigd naast deze policy bestaan (permissieve policies
-- combineren met OR).
create policy facturen_select_klant on public.facturen for select
  using (public.is_member_of_klant(klant_id));
