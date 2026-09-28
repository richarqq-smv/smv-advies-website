-- Klantomgeving-uitbreiding (2026-09-28): "Mijn facturen" op /account
-- hergebruikt FactuurDocument.jsx (zelfde weergave als de admin-
-- factuurdetailpagina), en dat document toont altijd SMV's eigen
-- bedrijfs-/betaalgegevens (IBAN, betalingsvoorwaarden, adres, ...) —
-- exact dezelfde gegevens die al op elke daadwerkelijk verstuurde factuur
-- staan die deze klant al ontvangt. factuur_instellingen was tot nu toe
-- alleen leesbaar voor een admin (0013_factuur_instellingen.sql), waardoor
-- een klant de eigen factuur niet volledig kon bekijken.
--
-- Bewust GEEN is_member_of_klant()-koppeling hier: dit is een singleton
-- (SMV's eigen instellingen, geen klant_id-kolom) en de inhoud is niet
-- klant-specifiek gevoelig — het is precies wat al op elke uitgaande
-- factuur staat. Elke ingelogde gebruiker mag dit dus lezen; wijzigen
-- blijft uitsluitend admin (factuur_instellingen_update_admin,
-- ongewijzigd).
create policy factuur_instellingen_select_authenticated on public.factuur_instellingen for select
  using (auth.role() = 'authenticated');
