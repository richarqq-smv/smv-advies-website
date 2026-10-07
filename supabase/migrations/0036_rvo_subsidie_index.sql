-- RVO-subsidie-naslag (onderzoeksronde 2026-10-07) — een maandelijks
-- gesynchroniseerde, admin-only referentielijst van actuele RVO-
-- subsidie/financieringspagina's (titel, omschrijving, sector/doelgroep,
-- link naar de officiële RVO-pagina). Bron: de publieke, licentievrije
-- (CC-0) open-data-feed https://www.rvo.nl/api/v1/opendata/subsidies —
-- exact de brondata achter RVO's eigen "Subsidie- en
-- financieringswijzer" (bevestigd via live testquery).
--
-- Bewust NIET opgenomen: percentages/bedragen (EIA-aftrekpercentage,
-- ISDE-bedragen per maatregel) — die staan niet in deze feed, alleen op
-- de RVO-pagina's zelf (via de meegeleverde url). Dit is dus een
-- doorzoekbare index/vindplaats, geen financiële rekentabel.
--
-- Twee tabellen:
--   rvo_subsidie_index  — de huidige lijst (wordt bij elke geslaagde
--                          sync volledig vervangen, nooit deels bijgewerkt)
--   rvo_sync_log         — één rij per syncpoging (ook bij mislukking),
--                          zodat er altijd een zichtbare status is en een
--                          mislukte sync nooit stilzwijgend voorbijgaat
--                          of de bestaande data corrumpeert.
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table public.rvo_subsidie_index (
  id uuid primary key,
  titel text not null,
  intro text,
  url text,
  type text,
  sectoren jsonb not null default '[]'::jsonb,
  onderwerpen jsonb not null default '[]'::jsonb,
  doelgroepen jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  rvo_gewijzigd_op timestamptz,
  gesynchroniseerd_op timestamptz not null default now()
);

create table public.rvo_sync_log (
  id bigint generated always as identity primary key,
  gestart_op timestamptz not null default now(),
  status text not null check (status in ('success', 'error')),
  aantal_items integer,
  foutmelding text
);
create index rvo_sync_log_gestart_op_idx on public.rvo_sync_log (gestart_op desc);

comment on table public.rvo_subsidie_index is 'Maandelijks gesynchroniseerde referentielijst RVO-subsidiepagina''s (titel/omschrijving/link) — geen percentages/bedragen, geen klantdata. Bron: rvo.nl/api/v1/opendata/subsidies.';
comment on table public.rvo_sync_log is 'Eén rij per syncpoging (ook bij mislukking) van rvo_subsidie_index — maakt syncstatus altijd zichtbaar i.p.v. stil te falen.';

-- Admin-only leesrechten — zelfde patroon als dossier_subsidies
-- (0035_dossier_subsidies.sql). Schrijven gebeurt uitsluitend door de
-- Edge Function rvo-subsidies-sync (service_role, omzeilt RLS) via de
-- twee functies hieronder — er zijn dus bewust geen insert/update/
-- delete-policies.
alter table public.rvo_subsidie_index enable row level security;
create policy rvo_subsidie_index_select_admin on public.rvo_subsidie_index for select
  using (public.is_admin());

alter table public.rvo_sync_log enable row level security;
create policy rvo_sync_log_select_admin on public.rvo_sync_log for select
  using (public.is_admin());

-- Atomaire vervanging (language sql, geen plpgsql: één enkele impliciete
-- transactie, geen losse begin/end-blokken nodig). `where true` op de
-- delete is vereist door een ingebouwde veiligheidsregel van dit
-- Supabase-project die een onvoorwaardelijke DELETE weigert — zie
-- live-test vóór deze migratie. Alleen aanroepbaar door service_role
-- (zie revoke/grant onderaan) — de Edge Function valideert de
-- RVO-respons eerst volledig vóórdat dit ooit wordt aangeroepen.
create or replace function public.rvo_sync_vervang_index(p_items jsonb)
returns void
language sql
as $$
  delete from public.rvo_subsidie_index where true;

  insert into public.rvo_subsidie_index (id, titel, intro, url, type, sectoren, onderwerpen, doelgroepen, tags, rvo_gewijzigd_op)
  select
    (x->>'id')::uuid,
    x->>'titel',
    x->>'intro',
    x->>'url',
    x->>'type',
    coalesce(x->'sectoren', '[]'::jsonb),
    coalesce(x->'onderwerpen', '[]'::jsonb),
    coalesce(x->'doelgroepen', '[]'::jsonb),
    coalesce(x->'tags', '[]'::jsonb),
    nullif(x->>'rvo_gewijzigd_op', '')::timestamptz
  from jsonb_array_elements(p_items) as x
  where x->>'id' is not null and x->>'titel' is not null;

  insert into public.rvo_sync_log (status, aantal_items)
  select 'success', count(*) from public.rvo_subsidie_index;
$$;

-- Losse, altijd-beschikbare foutlogfunctie: wordt aangeroepen zodra de
-- Edge Function om wat voor reden dan ook niet tot een geslaagde sync
-- komt (netwerkfout, onverwacht antwoordformaat, lege respons) — raakt
-- rvo_subsidie_index zelf nooit aan, dus de laatst bekende goede data
-- blijft gewoon zichtbaar voor de admin.
create or replace function public.rvo_sync_log_fout(p_foutmelding text)
returns void
language sql
as $$
  insert into public.rvo_sync_log (status, foutmelding) values ('error', p_foutmelding);
$$;

revoke all on function public.rvo_sync_vervang_index(jsonb) from public, anon, authenticated;
revoke all on function public.rvo_sync_log_fout(text) from public, anon, authenticated;
grant execute on function public.rvo_sync_vervang_index(jsonb) to service_role;
grant execute on function public.rvo_sync_log_fout(text) to service_role;

-- Maandelijkse trigger (1e van de maand, 03:00 UTC) — pg_net doet de
-- HTTP-aanroep naar de Edge Function vanuit de database zelf, dus er is
-- geen externe scheduler nodig. De Authorization-header gebruikt de
-- publieke anon-key (dezelfde key als in de frontend-bundle/.env.local
-- — bewust geen service_role-sleutel in deze migratie, die blijft
-- uitsluitend binnen de Edge Function via de automatisch meegegeven
-- SUPABASE_SERVICE_ROLE_KEY-omgevingsvariabele).
select cron.schedule(
  'rvo-subsidies-maandelijkse-sync',
  '0 3 1 * *',
  $$
  select net.http_post(
    url := 'https://cdthrbflmuqblydggszf.supabase.co/functions/v1/rvo-subsidies-sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdGhyYmZsbXVxYmx5ZGdnc3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNzExMTcsImV4cCI6MjEwNTg0NzExN30.3YChfpHFdSU-WiEyEyfgscVhnz1_UhCHTQuUj7gGahU',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
