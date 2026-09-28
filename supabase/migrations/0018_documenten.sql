-- "Mijn documenten" (Klantomgeving-uitbreiding, 2026-09-28) — de eerste
-- Storage-integratie in deze applicatie (voorheen bestond alleen
-- kosten.document_url als vrij tekstveld naar een elders bewaard document,
-- bewust zonder eigen opslag, zie 0015_kosten.sql). Hier is een echte
-- upload/download-functie expliciet gevraagd ("Klant mag eigen documenten
-- uploaden/bekijken/downloaden/verwijderen"), dus nu wel een eigen, kleine
-- opzet: één privé Storage-bucket + één lichte metadata-tabel, geen
-- vervanging van de bestaande architectuur.
--
-- Padconventie in de bucket: elk object staat onder `${klant_id}/...` —
-- dat eerste pad-segment is de enige autorisatiegrens voor Storage zelf
-- (via storage.foldername(), hieronder), volledig los van deze
-- metadata-tabel. `documenten` is uitsluitend de doorzoekbare/leesbare
-- lijst (bestandsnaam/omschrijving/wie/wanneer) — de bytes zelf staan
-- alleen in Storage.
create table public.documenten (
  document_id uuid primary key default gen_random_uuid(),
  klant_id uuid not null references public.klanten(klant_id) on delete cascade,
  -- Optioneel: welk Dossier dit document betreft (bijv. een MJOP-bijlage) —
  -- net als facturen.dossier_id niet verplicht, een document kan ook
  -- klantbreed zijn (bijv. een KvK-uittreksel).
  dossier_id uuid references public.dossiers(dossier_id) on delete set null,
  bestandsnaam text not null,
  storage_path text not null unique,
  omschrijving text,
  grootte_bytes bigint,
  content_type text,
  geupload_door uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index documenten_klant_idx on public.documenten (klant_id);
create index documenten_dossier_idx on public.documenten (dossier_id);

alter table public.documenten enable row level security;

-- Zelfde lid-of-admin-patroon als overal elders — een klant ziet/beheert
-- uitsluitend documenten van de eigen Klant, nooit die van een andere.
create policy documenten_select on public.documenten for select
  using (public.is_member_of_klant(klant_id) or public.is_admin());
create policy documenten_insert on public.documenten for insert
  with check (public.is_admin() or (public.is_member_of_klant(klant_id) and geupload_door = auth.uid()));
create policy documenten_delete on public.documenten for delete
  using (public.is_member_of_klant(klant_id) or public.is_admin());
-- Geen update-policy: een document wordt vervangen (nieuwe upload), niet
-- bewerkt — zelfde eenvoud-overweging als facturen.regels (geen losse
-- veldmutatie op iets dat als geheel hoort te kloppen).

-- ============================================================
-- STORAGE — privébucket, geen publieke URL's.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('klant-documenten', 'klant-documenten', false)
on conflict (id) do nothing;

-- storage.foldername(name) splitst het object-pad ("<klant_id>/<bestand>")
-- in segmenten; segment 1 is in deze bucket altijd de klant_id — dezelfde
-- is_member_of_klant()-grens als op elke andere klanttabel, nu toegepast
-- op het pad in plaats van op een kolom. Een ongeldig/leeg eerste segment
-- laat de uuid-cast falen, wat de policy gewoon false maakt (geen toegang) —
-- geen aparte foutafhandeling nodig.
create policy klant_documenten_select on storage.objects for select
  using (
    bucket_id = 'klant-documenten'
    and (public.is_admin() or public.is_member_of_klant((storage.foldername(name))[1]::uuid))
  );
create policy klant_documenten_insert on storage.objects for insert
  with check (
    bucket_id = 'klant-documenten'
    and (public.is_admin() or public.is_member_of_klant((storage.foldername(name))[1]::uuid))
  );
create policy klant_documenten_delete on storage.objects for delete
  using (
    bucket_id = 'klant-documenten'
    and (public.is_admin() or public.is_member_of_klant((storage.foldername(name))[1]::uuid))
  );
