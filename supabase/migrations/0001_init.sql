-- SMV Advies — initiële productieschema.
--
-- Status: ONTWORPEN EN DOOR EEN ADVERSARIËLE SECURITY REVIEW GEHAALD.
-- NOG NIET UITGEVOERD TEGEN EEN LEVENDE DATABASE — er bestaat op het
-- moment van schrijven nog geen Supabase-project voor dit account. Dit
-- bestand is de bron van waarheid om handmatig (eenmalig) uit te voeren
-- in de Supabase SQL Editor zodra dat project bestaat, of om later via
-- de Supabase CLI te migreren. Zie ../../DATABASE_ARCHITECTURE.md en
-- ../../SECURITY_MODEL.md voor de volledige toelichting/redenering.
--
-- Herbruikt letterlijk de bestaande domeinnamen uit src/lib/dossier/
-- (Klant, Contactpersoon, Pand, Dossier, Adviespunt) — geen parallel
-- datamodel, alleen de bestaande velden relationeel vastgelegd.

create extension if not exists pgcrypto;

-- ============================================================
-- TABELLEN
-- ============================================================

-- Persoonsinformatie van een geauthenticeerd account. De primaire
-- identiteit komt uit auth.users.id (Supabase Auth), nooit uit
-- localStorage. Bevat bewust GEEN rol-/rechtenveld — zie user_roles.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  naam text,
  telefoon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Rol leeft in een eigen tabel, met — zie de RLS-sectie hieronder —
-- GEEN ENKELE policy voor authenticated/anon. Dat is een bewuste,
-- door de security review afgedwongen keuze: een customer kan deze
-- tabel via geen enkele route lezen of schrijven, dus ook nooit
-- zichzelf admin maken. Zie SECURITY_MODEL.md, "Bevinding 1".
create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

-- Klant = bedrijfs-/klantcontext (bestaand "Klant"-domeinmodel).
create table public.klanten (
  klant_id uuid primary key default gen_random_uuid(),
  naam text,
  bedrijfsnaam text,
  email text,
  telefoon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Contactpersoon = persoon gekoppeld aan een Klant, optioneel gekoppeld
-- aan een account (account_id). Eén Klant kan meerdere Contactpersonen
-- hebben; niet elke Contactpersoon heeft een account.
create table public.contactpersonen (
  contactpersoon_id uuid primary key default gen_random_uuid(),
  klant_id uuid not null references public.klanten(klant_id) on delete cascade,
  account_id uuid references auth.users(id) on delete set null,
  naam text not null,
  email text,
  telefoon text,
  rol text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contactpersonen_klant_idx on public.contactpersonen (klant_id);
create index contactpersonen_account_idx on public.contactpersonen (account_id);

-- Pand = fysieke/technische eenheid, bewust klant-agnostisch (bestaande
-- architectuurbeslissing uit het Pand-basismodel) — de koppeling loopt
-- via klant_pand_relaties, niet via een klant_id-kolom hier.
create table public.panden (
  pand_id uuid primary key default gen_random_uuid(),
  omschrijving text,
  adres text,
  postcode text,
  plaats text,
  bouwjaar int,
  gebruikstype text,
  vloeroppervlak numeric,
  bouwlagen int,
  gebruikers int,
  energiebron text,
  verwarmingssysteem_type text,
  energielabel text,
  opmerkingen text,
  ontstaan_via text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.klant_pand_relaties (
  relatie_id uuid primary key default gen_random_uuid(),
  klant_id uuid not null references public.klanten(klant_id) on delete cascade,
  pand_id uuid not null references public.panden(pand_id) on delete cascade,
  aangemaakt_op timestamptz not null default now(),
  unique (klant_id, pand_id)
);
create index klant_pand_relaties_pand_idx on public.klant_pand_relaties (pand_id);

-- Dossier = adviescontext/snapshot, het bestaande koppelpunt tussen
-- Klant, Pand, Contactpersoon en de MJOP-momentopname. "restrict" (niet
-- cascade) op klant_id/pand_id: een Klant of Pand met nog bestaande
-- Dossiers kan niet zomaar worden verwijderd.
create table public.dossiers (
  dossier_id uuid primary key default gen_random_uuid(),
  klant_id uuid not null references public.klanten(klant_id) on delete restrict,
  pand_id uuid not null references public.panden(pand_id) on delete restrict,
  primaire_contactpersoon_id uuid references public.contactpersonen(contactpersoon_id) on delete set null,
  status text not null default 'open' check (status in ('open', 'afgerond')),
  pand_snapshot jsonb not null,
  contactpersoon_snapshot jsonb,
  mjop_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index dossiers_klant_idx on public.dossiers (klant_id);
create index dossiers_pand_idx on public.dossiers (pand_id);

-- Adviespunt = concrete adviesregel binnen een Dossier. Behoudt exact de
-- bestaande betekenis: herkomst automatisch/handmatig, signaal_bevroren
-- alleen bij een automatisch signaal, de vijf bestaande adviesstatussen.
create table public.adviespunten (
  adviespunt_id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(dossier_id) on delete cascade,
  onderwerp text not null,
  herkomst text not null check (herkomst in ('automatisch', 'handmatig')),
  signaal_bevroren jsonb,
  advies_status text not null check (advies_status in (
    'nu_onderzoeken', 'onvoldoende_informatie', 'meenemen_bij_vervanging',
    'later_beoordelen', 'geen_actie_nodig'
  )),
  toelichting text not null,
  herbeoordelen_bij text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint signaal_alleen_bij_automatisch check (
    (herkomst = 'automatisch' and signaal_bevroren is not null) or
    (herkomst = 'handmatig' and signaal_bevroren is null)
  )
);
create index adviespunten_dossier_idx on public.adviespunten (dossier_id);

-- ============================================================
-- HELPERFUNCTIES EN ATOMAIRE RPC'S
-- ============================================================

-- SECURITY INVOKER (bewust): leunt op de "account_id = auth.uid()"-tak
-- van de contactpersonen-SELECT-policy hieronder, heeft dus geen
-- verhoogd recht nodig. Geen parameter voor een ander account — kan
-- nooit voor iemand anders worden gebruikt.
create or replace function public.is_member_of_klant(target_klant_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.contactpersonen
    where klant_id = target_klant_id and account_id = auth.uid()
  );
$$;

-- SECURITY DEFINER is hier wel nodig: user_roles heeft geen enkele
-- policy voor authenticated, dus zonder verhoogd recht zou dit altijd
-- false teruggeven, ook voor een echte admin. Geeft uitsluitend een
-- boolean over de AANROEPER terug (auth.uid(), geen parameter).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Onboarding: atomair Klant + eerste Contactpersoon aanmaken. Gebruikt
-- uitsluitend auth.uid() (nooit een meegegeven account_id-parameter),
-- weigert als dit account al aan een klant gekoppeld is.
create or replace function public.registreer_klant(
  p_naam text, p_bedrijfsnaam text, p_email text, p_telefoon text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_klant_id uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Niet ingelogd.';
  end if;
  if exists (select 1 from public.contactpersonen where account_id = v_uid) then
    raise exception 'Dit account is al aan een klant gekoppeld.';
  end if;
  insert into public.klanten (naam, bedrijfsnaam, email, telefoon)
  values (p_naam, p_bedrijfsnaam, p_email, p_telefoon)
  returning klant_id into v_klant_id;
  insert into public.contactpersonen (klant_id, account_id, naam, email, telefoon, rol)
  values (v_klant_id, v_uid, p_naam, p_email, p_telefoon, 'eigenaar');
  return v_klant_id;
end;
$$;
revoke all on function public.registreer_klant from public, anon;
grant execute on function public.registreer_klant to authenticated;

-- Pand + eerste koppeling atomair, om een race condition tussen "pand
-- aanmaken" en "koppelen" onmogelijk te maken. Accepteert nooit een
-- bestaand pand_id — maakt altijd een nieuw Pand aan, dus een customer
-- kan zich hiermee nooit aan andermans bestaande Pand koppelen.
create or replace function public.maak_pand_en_koppel(p_klant_id uuid, p_pand jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pand_id uuid;
begin
  if not public.is_member_of_klant(p_klant_id) then
    raise exception 'Geen toegang tot deze klant.';
  end if;
  insert into public.panden (
    omschrijving, adres, postcode, plaats, bouwjaar, gebruikstype, vloeroppervlak,
    bouwlagen, gebruikers, energiebron, verwarmingssysteem_type, energielabel,
    opmerkingen, ontstaan_via
  ) values (
    p_pand->>'omschrijving', p_pand->>'adres', p_pand->>'postcode', p_pand->>'plaats',
    (p_pand->>'bouwjaar')::int, p_pand->>'gebruikstype', (p_pand->>'vloeroppervlak')::numeric,
    (p_pand->>'bouwlagen')::int, (p_pand->>'gebruikers')::int, p_pand->>'energiebron',
    p_pand->>'verwarmingssysteemType', p_pand->>'energielabel', p_pand->>'opmerkingen',
    p_pand->>'ontstaanVia'
  ) returning pand_id into v_pand_id;
  insert into public.klant_pand_relaties (klant_id, pand_id) values (p_klant_id, v_pand_id);
  return v_pand_id;
end;
$$;
revoke all on function public.maak_pand_en_koppel from public, anon;
grant execute on function public.maak_pand_en_koppel to authenticated;

-- Nieuw account krijgt automatisch een profiel + een 'customer'-rolrij.
-- Draait als trigger op auth.users — de enige plek waar een
-- user_roles-rij ontstaat voor een nieuw account, altijd 'customer'.
-- Promotie naar 'admin' gebeurt uitsluitend via een losse, eenmalige
-- SQL-actie (zie DATABASE_ARCHITECTURE.md, "Admin bootstrap").
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  insert into public.user_roles (user_id, role) values (new.id, 'customer');
  return new;
end;
$$;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- TRIGGERS: afgerond Dossier is echt immutable, Klant/Pand niet te
-- "verplaatsen" — onafhankelijk van RLS, als tweede, structurele slot.
-- ============================================================

create or replace function public.bewaak_dossier_integriteit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if OLD.status = 'afgerond' then
    raise exception 'Een afgerond Dossier kan niet meer worden gewijzigd.';
  end if;
  if NEW.klant_id <> OLD.klant_id or NEW.pand_id <> OLD.pand_id then
    raise exception 'De klant- of pandkoppeling van een Dossier kan niet worden gewijzigd.';
  end if;
  return NEW;
end;
$$;
create trigger dossiers_bewaak_integriteit
before update on public.dossiers
for each row execute function public.bewaak_dossier_integriteit();

create or replace function public.bewaak_adviespunt_integriteit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_status text;
  v_dossier_id uuid := coalesce(NEW.dossier_id, OLD.dossier_id);
begin
  select status into v_status from public.dossiers where dossier_id = v_dossier_id;
  if v_status = 'afgerond' then
    raise exception 'Adviespunten van een afgerond Dossier kunnen niet meer worden gewijzigd.';
  end if;
  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$;
create trigger adviespunten_bewaak_integriteit
before insert or update or delete on public.adviespunten
for each row execute function public.bewaak_adviespunt_integriteit();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.klanten enable row level security;
alter table public.contactpersonen enable row level security;
alter table public.panden enable row level security;
alter table public.klant_pand_relaties enable row level security;
alter table public.dossiers enable row level security;
alter table public.adviespunten enable row level security;
-- user_roles: bewust geen enkele policy hieronder — RLS-default-deny is
-- hier de hele beveiliging.

create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_delete_admin on public.profiles for delete
  using (public.is_admin());
revoke update on public.profiles from authenticated;
grant update (naam, telefoon) on public.profiles to authenticated;

create policy klanten_select on public.klanten for select
  using (public.is_member_of_klant(klant_id) or public.is_admin());
create policy klanten_update on public.klanten for update
  using (public.is_member_of_klant(klant_id) or public.is_admin())
  with check (public.is_member_of_klant(klant_id) or public.is_admin());
create policy klanten_insert_admin on public.klanten for insert
  with check (public.is_admin());
create policy klanten_delete_admin on public.klanten for delete
  using (public.is_admin());

create policy contactpersonen_select on public.contactpersonen for select
  using (public.is_member_of_klant(klant_id) or account_id = auth.uid() or public.is_admin());
create policy contactpersonen_insert on public.contactpersonen for insert
  with check (public.is_admin() or (
    public.is_member_of_klant(klant_id) and (account_id is null or account_id = auth.uid())
  ));
create policy contactpersonen_update on public.contactpersonen for update
  using (public.is_member_of_klant(klant_id) or public.is_admin())
  with check (public.is_admin() or (
    public.is_member_of_klant(klant_id) and (account_id is null or account_id = auth.uid())
  ));
create policy contactpersonen_delete on public.contactpersonen for delete
  using (public.is_member_of_klant(klant_id) or public.is_admin());

create policy panden_select on public.panden for select
  using (public.is_admin() or exists (
    select 1 from public.klant_pand_relaties kpr
    where kpr.pand_id = panden.pand_id and public.is_member_of_klant(kpr.klant_id)
  ));
create policy panden_update on public.panden for update
  using (public.is_admin() or exists (
    select 1 from public.klant_pand_relaties kpr
    where kpr.pand_id = panden.pand_id and public.is_member_of_klant(kpr.klant_id)
  ))
  with check (public.is_admin() or exists (
    select 1 from public.klant_pand_relaties kpr
    where kpr.pand_id = panden.pand_id and public.is_member_of_klant(kpr.klant_id)
  ));
create policy panden_insert_admin on public.panden for insert with check (public.is_admin());
create policy panden_delete_admin on public.panden for delete using (public.is_admin());

create policy kpr_select on public.klant_pand_relaties for select
  using (public.is_member_of_klant(klant_id) or public.is_admin());
create policy kpr_delete on public.klant_pand_relaties for delete
  using (public.is_member_of_klant(klant_id) or public.is_admin());
create policy kpr_insert_admin on public.klant_pand_relaties for insert with check (public.is_admin());

create policy dossiers_select on public.dossiers for select
  using (public.is_member_of_klant(klant_id) or public.is_admin());
create policy dossiers_insert on public.dossiers for insert
  with check (public.is_admin() or (
    public.is_member_of_klant(klant_id)
    and exists (
      select 1 from public.klant_pand_relaties kpr
      where kpr.klant_id = dossiers.klant_id and kpr.pand_id = dossiers.pand_id
    )
    and (primaire_contactpersoon_id is null or exists (
      select 1 from public.contactpersonen cp
      where cp.contactpersoon_id = dossiers.primaire_contactpersoon_id and cp.klant_id = dossiers.klant_id
    ))
  ));
create policy dossiers_update on public.dossiers for update
  using ((public.is_member_of_klant(klant_id) and status = 'open') or public.is_admin())
  with check (public.is_admin() or (
    public.is_member_of_klant(klant_id)
    and exists (
      select 1 from public.klant_pand_relaties kpr
      where kpr.klant_id = dossiers.klant_id and kpr.pand_id = dossiers.pand_id
    )
    and (primaire_contactpersoon_id is null or exists (
      select 1 from public.contactpersonen cp
      where cp.contactpersoon_id = dossiers.primaire_contactpersoon_id and cp.klant_id = dossiers.klant_id
    ))
  ));
create policy dossiers_delete_admin on public.dossiers for delete using (public.is_admin());

create policy adviespunten_select on public.adviespunten for select
  using (public.is_admin() or exists (
    select 1 from public.dossiers d
    where d.dossier_id = adviespunten.dossier_id and public.is_member_of_klant(d.klant_id)
  ));
create policy adviespunten_insert on public.adviespunten for insert
  with check (public.is_admin() or exists (
    select 1 from public.dossiers d
    where d.dossier_id = adviespunten.dossier_id and d.status = 'open' and public.is_member_of_klant(d.klant_id)
  ));
create policy adviespunten_update on public.adviespunten for update
  using (public.is_admin() or exists (
    select 1 from public.dossiers d
    where d.dossier_id = adviespunten.dossier_id and d.status = 'open' and public.is_member_of_klant(d.klant_id)
  ))
  with check (public.is_admin() or exists (
    select 1 from public.dossiers d
    where d.dossier_id = adviespunten.dossier_id and d.status = 'open' and public.is_member_of_klant(d.klant_id)
  ));
create policy adviespunten_delete on public.adviespunten for delete
  using (public.is_admin() or exists (
    select 1 from public.dossiers d
    where d.dossier_id = adviespunten.dossier_id and d.status = 'open' and public.is_member_of_klant(d.klant_id)
  ));
