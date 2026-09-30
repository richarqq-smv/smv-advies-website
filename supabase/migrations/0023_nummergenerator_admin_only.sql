-- Nummergenerator-RPC's admin-only maken (cleanup-ronde) — aanleiding: de
-- Supabase security advisor meldt dat genereer_factuur_nummer()/
-- genereer_offerte_nummer() uitvoerbaar zijn door elke authenticated
-- gebruiker. Onderzoek (Read/Grep) wees uit dat de app deze functies NOOIT
-- rechtstreeks aanroept (geen `.rpc('genereer_*_nummer')` ergens in
-- src/) — ze lopen uitsluitend als kolom-DEFAULT tijdens een door RLS al
-- admin-only afgeschermde INSERT op facturen/offertes. Het enige
-- daadwerkelijke risico is dus een klant die de RPC rechtstreeks aanroept
-- (buiten de app om, bijv. via de PostgREST-endpoint) en zo de sequence
-- laat oplopen zonder ooit een echte factuur/offerte aan te kunnen maken
-- (RLS blokkeert de INSERT zelf al) — een laag-risico "nummer verspild"-
-- hinder, geen dataleak.
--
-- EXECUTE simpelweg van `authenticated` afpakken kan niet: er bestaat geen
-- aparte Postgres-rol voor een admin-gebruiker (admin/klant is uitsluitend
-- een onderscheid in de user_roles-tabel, elke ingelogde gebruiker draait
-- als dezelfde Postgres-rol `authenticated`) — dat zou dus ook de
-- legitieme admin-flow breken. Oplossing: een is_admin()-controle IN de
-- functie zelf, zelfde patroon als elders in de codebase (bewaak_*_
-- integriteit-triggers, adviespunten_insert, enz.). Dit vereist plpgsql
-- i.p.v. de huidige `language sql` (die kent geen RAISE) — verder blijft
-- de nummeringslogica (prefix + jaartal + nextval() van dezelfde sequence)
-- woordelijk ongewijzigd, dus de nummering zelf blijft atomair en
-- doorlopend zoals voorheen.
create or replace function public.genereer_factuur_nummer()
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Alleen SMV kan een factuurnummer genereren.';
  end if;
  return (select factuurprefix from public.factuur_instellingen where id = 1)
    || '-' || extract(year from now())::text || '-' || lpad(nextval('public.factuur_nummer_seq')::text, 4, '0');
end;
$$;
-- Grants blijven ongewijzigd (al revoked van public/anon sinds
-- 0014_facturen.sql) — authenticated blijft nodig zodat de kolom-DEFAULT
-- tijdens een admin-INSERT kan blijven werken; de nieuwe is_admin()-check
-- hierboven is de daadwerkelijke afscherming.

create or replace function public.genereer_offerte_nummer()
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Alleen SMV kan een offertenummer genereren.';
  end if;
  return 'SMV-OFF-' || extract(year from now())::text || '-' || lpad(nextval('public.offerte_nummer_seq')::text, 4, '0');
end;
$$;
