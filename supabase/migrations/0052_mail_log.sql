-- Mail-log voor het admin-dashboard-meldingenblokje (ronde 2026-10-16).
-- Aanleiding: een live onderzoek naar "deze mail krijg ik niet" bracht aan
-- het licht dat de interne leadmail bij een energie-indicatie bewust
-- fire-and-forget is (useEnergieScan.js: sendMail('energie-lead',
-- leadParams).catch(() => {})) — zodat een mislukte interne notificatie
-- nooit de klantervaring blokkeert. Dat gedrag blijft ongewijzigd, maar tot
-- nu toe was een mislukte verzending daardoor ook voor de admin volledig
-- onzichtbaar. Deze tabel geeft de send-email Edge Function een plek om
-- elke verzendpoging vast te leggen (gelukt of niet), zodat het
-- dashboard dat kan tonen.
--
-- Zelfde architectuur als rvo_sync_log (0036_rvo_subsidie_index.sql):
-- RLS aan, uitsluitend een admin-only SELECT-policy. Schrijven gebeurt
-- nooit via de normale (anon/authenticated) client — alleen de Edge
-- Function, met de service-role-sleutel, die RLS sowieso altijd omzeilt.
-- Geen enkele voor de klant/browser bereikbare INSERT/UPDATE/DELETE-weg.
create table public.mail_log (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('contact', 'energie-lead', 'energie-confirm', 'mjop')),
  ontvanger text,
  gelukt boolean not null,
  foutmelding text,
  created_at timestamptz not null default now()
);

alter table public.mail_log enable row level security;

create policy mail_log_select_admin on public.mail_log for select
  using (public.is_admin());
