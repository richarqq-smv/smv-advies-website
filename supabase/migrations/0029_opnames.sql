-- Voorbereiding mobiele opnameflow (2026-09-30) — aanleiding: de klant
-- gaat een echte opnamechecklist/formulieren aanleveren, maar die
-- inhoud is er nog niet. Deze migratie bouwt UITSLUITEND het generieke,
-- inhoudsvrije koepelrecord dat sowieso nodig zal zijn zodra die checklist
-- er is — ongeacht hoe die checklist er precies uitziet. Geen
-- observatie-/metingen-/locatiekoppelingtabellen: die kolommen zijn per
-- definitie afhankelijk van de nog te ontvangen brondocumenten en worden
-- dus bewust NIET geraden (zie het bijbehorende architectuurvoorstel in
-- het gespreksverslag van deze ronde, niet in deze migratie).
--
-- Architectuurkeuze: een Opname is een NIEUW, eigen concept (één record
-- per fysiek bezoek/sessie), geen hergebruik van `dossier_taken` — dat is
-- een actie-/voortgangstabel (subsidie/oplevering), geen koepel voor een
-- verzameling waarnemingen. Wel hergebruik waar dat al kan:
-- `planning_afspraken` (bestaande agenda, type 'bedrijfsbezoek' bestaat
-- al) kan straks het geplande bezoek zijn waar deze Opname het
-- daadwerkelijke resultaat van is — vandaar de optionele koppeling
-- hieronder, in plaats van een tweede datum/tijd-registratie.
create table public.opnames (
  opname_id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(dossier_id) on delete cascade,
  -- Optioneel: welke geplande afspraak (planning_afspraken, bijv. type
  -- 'bedrijfsbezoek') dit de uitvoering van is — voorkomt dat datum/klant/
  -- context straks dubbel wordt vastgelegd als een opname al gepland stond.
  planning_afspraak_id uuid references public.planning_afspraken(afspraak_id) on delete set null,
  status text not null default 'concept' check (status in ('concept', 'opgeslagen', 'afgerond')),
  opname_datum date,
  uitgevoerd_door uuid not null default auth.uid() references auth.users(id) on delete restrict,
  notitie text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index opnames_dossier_idx on public.opnames (dossier_id);
create index opnames_afspraak_idx on public.opnames (planning_afspraak_id);

-- Admin-only — zelfde overweging als dossier_taken/planning_afspraken:
-- een opname is adviseurswerk in uitvoering, geen klantgericht scherm.
-- Als de klant hier later iets van moet zien, is dat een bewuste,
-- aparte SELECT-policy-uitbreiding, geen impliciete bijvangst van deze
-- migratie.
alter table public.opnames enable row level security;

create policy opnames_select_admin on public.opnames for select
  using (public.is_admin());
create policy opnames_insert_admin on public.opnames for insert
  with check (public.is_admin());
create policy opnames_update_admin on public.opnames for update
  using (public.is_admin())
  with check (public.is_admin());
create policy opnames_delete_admin on public.opnames for delete
  using (public.is_admin());

-- ============================================================
-- DOCUMENTEN — optionele koppeling aan een Opname
-- ============================================================
--
-- Hergebruikt bewust de bestaande Storage/documenten-infrastructuur
-- (0018_documenten.sql) voor toekomstige opnamefoto's/-bijlagen, in
-- plaats van een aparte "foto's"-tabel: content_type onderscheidt een
-- foto al van een ander bestandstype, en klant-self-service-upload/
-- download/verwijderen werkt al. Puur additief en nullable, geen
-- bestaand gedrag verandert.
alter table public.documenten
  add column opname_id uuid references public.opnames(opname_id) on delete set null;
create index documenten_opname_idx on public.documenten (opname_id);
