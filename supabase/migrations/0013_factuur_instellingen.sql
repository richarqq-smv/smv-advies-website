-- Administratie-uitbreiding (2026-09-28): centrale, admin-only
-- configuratiebron voor factuurgegevens — bewust NIET verspreid als
-- hardcoded constanten door React-componenten (zie src/data/company.js,
-- dat blijft de bron voor de PUBLIEKE website en dit doel niet dient:
-- IBAN/btw-id/betalingsvoorwaarden horen niet in de publieke bundle en
-- moeten door de admin zelf bewerkbaar zijn zonder nieuwe deploy).
--
-- Singleton-tabel (klassiek Postgres-patroon): `id` kan alleen de waarde
-- 1 zijn, dus er kan nooit meer dan één rij bestaan. Één seed-rij hieronder
-- zodat de applicatie altijd iets heeft om te lezen/bewerken (nooit "geen
-- instellingen gevonden" als aparte foutsituatie).
create table public.factuur_instellingen (
  id int primary key default 1 check (id = 1),
  bedrijfsnaam text not null default 'SMV Advies',
  adres text,
  postcode text,
  plaats text,
  kvk_nummer text,
  btw_id text,
  iban text,
  tenaamstelling text,
  betalingsvoorwaarden text not null default 'Wij verzoeken u het factuurbedrag binnen de gestelde betalingstermijn over te maken onder vermelding van het factuurnummer.',
  standaard_betalingstermijn_dagen int not null default 14 check (standaard_betalingstermijn_dagen > 0),
  factuurprefix text not null default 'SMV-FAC',
  standaard_btw_percentage numeric(5, 2) not null default 21 check (standaard_btw_percentage >= 0),
  updated_at timestamptz not null default now()
);
insert into public.factuur_instellingen (id) values (1);

alter table public.factuur_instellingen enable row level security;

-- Volledig admin-only: geen enkele policy voor een klant, dus RLS
-- weigert een klant standaard elke lees/schrijfactie (geen enkele policy
-- matcht) — zelfde patroon als planning_afspraken/dossier_commerciele_
-- kansen (0011/0012). Geen insert/delete-policy nodig: de enige rij
-- bestaat al (seed hierboven) en de CHECK (id = 1) verhindert sowieso
-- ooit een tweede rij.
create policy factuur_instellingen_select_admin on public.factuur_instellingen for select
  using (public.is_admin());
create policy factuur_instellingen_update_admin on public.factuur_instellingen for update
  using (public.is_admin())
  with check (public.is_admin());
