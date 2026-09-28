-- Kosten/uitgaven (Administratie-uitbreiding, 2026-09-28) — eenvoudige
-- registratie van zakelijke kosten, geen crediteurenadministratie (geen
-- inkoopfacturen-workflow, geen goedkeuringsproces, geen koppeling aan
-- leveranciers-stamdata). Geen immutability-trigger zoals offertes/
-- facturen: dit is een interne registratie die de admin altijd mag
-- corrigeren (typefout in een bedrag, verkeerde categorie), geen
-- extern/juridisch document zoals een verstuurde factuur.
--
-- `document_url` is bewust een los tekstveld (link naar een elders al
-- opgeslagen document, bijv. een e-mailbijlage of eigen cloudopslag), GEEN
-- bestandsupload: er bestaat in deze applicatie nog geen Supabase
-- Storage-integratie, en die erbij bouwen voor één los invoerveld zou de
-- kleinst mogelijke, eenvoudigste architectuur (zie bouwprompt) juist
-- tegenspreken.
create table public.kosten (
  kosten_id uuid primary key default gen_random_uuid(),
  datum date not null default current_date,
  leverancier text not null,
  omschrijving text not null,
  categorie text not null check (categorie in (
    'kantoor', 'reiskosten', 'software', 'marketing', 'verzekering', 'opleiding', 'overig'
  )),
  bedrag_excl_btw numeric(10, 2) not null check (bedrag_excl_btw >= 0),
  btw_percentage numeric(5, 2) not null check (btw_percentage >= 0),
  btw_bedrag numeric(10, 2) not null check (btw_bedrag >= 0),
  totaal_incl_btw numeric(10, 2) not null check (totaal_incl_btw >= 0),
  status text not null default 'open' check (status in ('open', 'betaald')),
  notitie text,
  document_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index kosten_datum_idx on public.kosten (datum);

-- Volledig admin-only, zelfde patroon als facturen/planning_afspraken/
-- dossier_commerciele_kansen — geen enkele policy voor een klant.
alter table public.kosten enable row level security;

create policy kosten_select_admin on public.kosten for select
  using (public.is_admin());
create policy kosten_insert_admin on public.kosten for insert
  with check (public.is_admin());
create policy kosten_update_admin on public.kosten for update
  using (public.is_admin())
  with check (public.is_admin());
create policy kosten_delete_admin on public.kosten for delete
  using (public.is_admin());
