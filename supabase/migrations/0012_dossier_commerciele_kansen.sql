-- Interne commerciële kans per dossier (2026-09-28) — uitsluitend
-- admininformatie, nooit zichtbaar voor de klantomgeving.
--
-- BEWUST een aparte tabel, niet een kolom op `dossiers`: getDossier() in
-- lib/klantOmgeving/api.js doet `select('*', ...)` op `dossiers` en wordt
-- door DossierDetail.jsx voor zowel een klant (RLS: is_member_of_klant)
-- als een admin gebruikt — dezelfde query, dezelfde kolommen. Een
-- commercieel veld op `dossiers` zelf zou dus met elke bestaande
-- dossiers_select-rij meekomen naar een klantsessie, alleen nog
-- UI-verborgen, niet daadwerkelijk onbereikbaar. Een losstaande tabel met
-- een eigen, strikt admin-only policyset (zie hieronder) maakt dat
-- structureel onmogelijk: een klant-fetch raakt deze tabel nooit, hoe
-- getDossier() ook verandert.
--
-- 1:1 op dossier_id (dossier_id is zelf de primary key, geen los id nodig)
-- — precies één commerciële inschatting per dossier, zoals gevraagd
-- ("een dossier kan zijn eigen commerciële status hebben"). `on delete
-- cascade`: deze rij heeft geen zelfstandige betekenis zonder het
-- dossier (in de praktijk raakt dit nooit een bestaand dossier, want
-- dossiers worden hier nooit hard verwijderd).
create table public.dossier_commerciele_kansen (
  dossier_id uuid primary key references public.dossiers(dossier_id) on delete cascade,
  vervolgstap text not null default 'nog_bepalen' check (vervolgstap in (
    'nog_bepalen', 'alleen_energie_quickscan', 'basis_orienteren', 'premium_beslissen',
    'gold_ontzorgd', 'meerdere_mogelijkheden', 'geen_vervolgopdracht'
  )),
  notitie text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Volledig admin-only, net als planning_afspraken (0011): geen enkele
-- policy voor een klant, dus RLS weigert een klant standaard elke
-- lees/schrijfactie. Dit is de enige echte toegangsgrens (naast de
-- admin-only UI-sectie in DossierDetail.jsx) — geen kolomrechten nodig
-- omdat de tabel zelf al nooit in een klantquery voorkomt.
alter table public.dossier_commerciele_kansen enable row level security;

create policy dossier_commerciele_kansen_select_admin on public.dossier_commerciele_kansen for select
  using (public.is_admin());
create policy dossier_commerciele_kansen_insert_admin on public.dossier_commerciele_kansen for insert
  with check (public.is_admin());
create policy dossier_commerciele_kansen_update_admin on public.dossier_commerciele_kansen for update
  using (public.is_admin())
  with check (public.is_admin());
create policy dossier_commerciele_kansen_delete_admin on public.dossier_commerciele_kansen for delete
  using (public.is_admin());
