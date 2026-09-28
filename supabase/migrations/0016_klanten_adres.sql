-- Klantomgeving-uitbreiding (2026-09-28): "Mijn bedrijf" op /account vraagt
-- om adresgegevens van de eigen Klant, maar `klanten` had tot nu toe alleen
-- naam/bedrijfsnaam/email/telefoon (zie 0001_init.sql) — geen fictief veld,
-- dit vult een echt ontbrekend, expliciet gevraagd basisgegeven aan (een
-- bedrijfsadres is net zo'n kerngegeven als het al bestaande
-- factuur_instellingen.adres/postcode/plaats voor SMV zelf).
--
-- Geen RLS-wijziging nodig: de bestaande klanten_update-policy
-- (0001_init.sql) staat een lid van deze Klant al toe om ELK veld van zijn
-- eigen klanten-rij te wijzigen (geen kolomrestrictie), dus deze nieuwe
-- kolommen vallen daar automatisch onder.
alter table public.klanten
  add column adres text,
  add column postcode text,
  add column plaats text;
