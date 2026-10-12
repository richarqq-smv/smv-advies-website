-- Implementatieronde 2026-10-12, punt 3: voorkomt een dubbel klantrecord
-- wanneer een medewerker een klant aanmaakt (admin_maak_klant_pand_dossier,
-- 0043) VOORDAT die klant zelf een account heeft, en de klant zich later
-- zelf registreert — registreer_klant() (0001_init.sql) maakt dan altijd
-- een NIEUWE klant aan, nooit een koppeling aan de bestaande. Zie het
-- commentaar in 0043_admin_klant_pand_dossier_aanmaken.sql, "resterende
-- beperkingen" — dit is exact die aangekondigde, bewuste uitbreiding.
--
-- Ontwerp: een eenmalige, moeilijk te raden koppelcode die een admin aan
-- een klant uitgeeft en de klant zelf invult bij registratie/koppelen.
-- De RUWE code wordt NOOIT opgeslagen — alleen een sha256-hash, exact
-- hetzelfde principe als een wachtwoord-reset-token. Beide RPC's zijn
-- SECURITY DEFINER met `set search_path = ''` en `revoke all ... grant
-- execute to authenticated`, hetzelfde patroon als elke bestaande
-- SECURITY DEFINER-functie in dit project (zie is_admin()/registreer_klant()
-- /admin_maak_klant_pand_dossier() in 0001_init.sql/0043).
create table public.klant_koppelcodes (
  koppelcode_id uuid primary key default gen_random_uuid(),
  klant_id uuid not null references public.klanten(klant_id) on delete cascade,
  -- sha256-hash (hex) van de ruwe code — de ruwe code zelf komt hier nooit
  -- in terecht, alleen éénmalig terug als return-waarde van de generator-
  -- functie hieronder, voor de admin om door te geven aan de klant.
  code_hash text not null,
  aangemaakt_door uuid references auth.users(id) on delete set null,
  aangemaakt_op timestamptz not null default now(),
  verloopt_op timestamptz not null,
  gebruikt_op timestamptz,
  gebruikt_door uuid references auth.users(id) on delete set null
);
create unique index klant_koppelcodes_code_hash_idx on public.klant_koppelcodes (code_hash);
create index klant_koppelcodes_klant_idx on public.klant_koppelcodes (klant_id);

-- Bewust GEEN enkele RLS-policy (alleen enable) — exact het bestaande
-- deny-by-default-patroon van user_roles (0001_init.sql): geen rol kan
-- deze tabel rechtstreeks lezen/schrijven, uitsluitend via de twee
-- SECURITY DEFINER-functies hieronder, die zelf hun eigen autorisatie
-- afdwingen (is_admin() resp. auth.uid()).
alter table public.klant_koppelcodes enable row level security;

-- Admin-only: genereert een nieuwe, eenmalige koppelcode voor een
-- bestaande klant. Zet eerst elke nog openstaande (ongebruikte) code voor
-- deze klant op direct verlopen (in plaats van verwijderen — zo blijft er
-- een auditspoor van eerder uitgegeven codes bewaard, maar kan geen van
-- die oudere codes nog gebruikt worden), zodat er nooit meerdere tegelijk
-- geldige codes rondzwerven — de admin geeft altijd de laatst gegenereerde
-- code door. Geldig 14 dagen. Retourneert de RUWE code precies één keer;
-- daarna is hij nergens meer uit de database terug te halen (alleen de
-- hash staat er nog).
create or replace function public.admin_genereer_klant_koppelcode(p_klant_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ruwe_code text;
begin
  if not public.is_admin() then
    raise exception 'Alleen een admin kan een koppelcode genereren.';
  end if;
  if not exists (select 1 from public.klanten where klant_id = p_klant_id) then
    raise exception 'Deze klant bestaat niet.';
  end if;

  update public.klant_koppelcodes set verloopt_op = now() where klant_id = p_klant_id and gebruikt_op is null and verloopt_op > now();

  v_ruwe_code := encode(extensions.gen_random_bytes(16), 'hex');

  insert into public.klant_koppelcodes (klant_id, code_hash, aangemaakt_door, verloopt_op)
  values (p_klant_id, encode(extensions.digest(v_ruwe_code, 'sha256'), 'hex'), auth.uid(), now() + interval '14 days');

  return v_ruwe_code;
end;
$$;
revoke all on function public.admin_genereer_klant_koppelcode(uuid) from public, anon;
grant execute on function public.admin_genereer_klant_koppelcode(uuid) to authenticated;

-- Self-service: koppelt het ingelogde account aan de klant die bij de
-- opgegeven koppelcode hoort. Atomair en eenmalig: de update hieronder
-- zet `gebruikt_op` alleen als die nog `null` was (en de code nog niet
-- verlopen is) en geeft het klant_id alleen terug als dat is gelukt —
-- bij twee gelijktijdige aanroepen met dezelfde code wint precies één
-- transactie (rij-vergrendeling in Postgres), de andere krijgt 0
-- bijgewerkte rijen en dus de foutmelding. Dezelfde dubbele-registratie-
-- guard als registreer_klant() (één klant per account).
create or replace function public.koppel_klant_met_code(p_code text, p_naam text, p_email text default null, p_telefoon text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_klant_id uuid;
begin
  if v_uid is null then
    raise exception 'Niet ingelogd.';
  end if;
  if coalesce(trim(p_naam), '') = '' then
    raise exception 'Vul uw naam in.';
  end if;
  if exists (select 1 from public.contactpersonen where account_id = v_uid) then
    raise exception 'Dit account is al aan een klant gekoppeld.';
  end if;

  update public.klant_koppelcodes
  set gebruikt_op = now(), gebruikt_door = v_uid
  where code_hash = encode(extensions.digest(trim(p_code), 'sha256'), 'hex')
    and gebruikt_op is null
    and verloopt_op > now()
  returning klant_id into v_klant_id;

  -- Bewust één en dezelfde melding voor "bestaat niet"/"verlopen"/"al
  -- gebruikt" — geen onderscheid lekken over welke van de drie het is.
  if v_klant_id is null then
    raise exception 'Deze koppelcode is ongeldig, verlopen of al gebruikt.';
  end if;

  insert into public.contactpersonen (klant_id, account_id, naam, email, telefoon, rol)
  values (v_klant_id, v_uid, trim(p_naam), p_email, p_telefoon, 'eigenaar');

  return v_klant_id;
end;
$$;
revoke all on function public.koppel_klant_met_code(text, text, text, text) from public, anon;
grant execute on function public.koppel_klant_met_code(text, text, text, text) to authenticated;
