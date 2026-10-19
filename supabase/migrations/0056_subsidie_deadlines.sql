-- Fase 7 (projectplan "Klantwaarde-uitbreidingen", #7): subsidie-
-- deadline-signalering. Vult exact de centrale "subsidie_regelingen"-
-- uitbreiding in die bij dossier_subsidies (0035_dossier_subsidies.sql)
-- bewust werd uitgesteld ("Fase 4, pas nodig zodra regeling_naam niet
-- langer vrije tekst mag zijn") — dossier_subsidies blijft ongewijzigd
-- (per-dossier traject, vrije tekst regeling_naam), deze tabel is er
-- uitdrukkelijk LOS van: regeling-brede kennis ("ISDE-budget 2026 bijna
-- op"), nooit een per-dossier feit.
--
-- Randvoorwaarde uit het projectplan: nooit een deadline tonen die niet
-- expliciet bevestigd is. Er bestaat geen betrouwbare, machineleesbare
-- bron voor ISDE/EIA/MIA/Vamil-deadlines/budgetstatus (bevestigd tijdens
-- eerdere onderzoeksrondes: de RVO-opendata-feed achter
-- rvo_subsidie_index bevat uitsluitend titel/omschrijving/link, geen
-- bedragen of deadlines). Elke rij hier is daarom altijd een EXPLICIET
-- door een admin ingevoerd en bevestigd feit, nooit automatisch
-- afgeleid/gescraped — vandaar de verplichte bron_notitie (geen rij
-- zonder brontoelichting) en het ontbreken van elke vorm van automatische
-- invoer (geen cron/Edge Function die deze tabel vult).
create table public.subsidie_deadlines (
  id uuid primary key default gen_random_uuid(),
  regeling text not null check (regeling in ('EIA', 'MIA', 'Vamil', 'ISDE')),
  deadline_datum date,
  budget_status text,
  bron_notitie text not null,
  gecontroleerd_op timestamptz not null default now(),
  actief boolean not null default true,
  constraint subsidie_deadlines_minimaal_een_feit check (deadline_datum is not null or budget_status is not null)
);
create index subsidie_deadlines_regeling_idx on public.subsidie_deadlines (regeling) where actief;
comment on table public.subsidie_deadlines is 'Admin-bevestigde deadline/budgetstatus per subsidieregeling (Fase 7, #7) — nooit automatisch ingevuld, altijd met bron_notitie. Een verouderde/vervallen rij wordt uitgezet (actief=false), nooit verwijderd.';

alter table public.subsidie_deadlines enable row level security;

create policy subsidie_deadlines_select_admin on public.subsidie_deadlines for select
  using (public.is_admin());

create policy subsidie_deadlines_insert_admin on public.subsidie_deadlines for insert
  with check (public.is_admin());

create policy subsidie_deadlines_update_admin on public.subsidie_deadlines for update
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.subsidie_deadlines from public, anon;
grant select, insert, update (actief) on public.subsidie_deadlines to authenticated;

-- Alleen uitzetten (actief=false) is toegestaan als wijziging — de
-- feitelijke inhoud (regeling/deadline/budgetstatus/bron) ligt vast zodra
-- bevestigd, zelfde "vastleggen, niet stilletjes aanpassen"-filosofie als
-- offerte_nummer/dossier_nummer elders in dit project (zie
-- bewaak_dossier_integriteit() voor het precedent). Een fout bevestigd
-- feit wordt dus uitgezet en opnieuw (correct) toegevoegd, nooit in-place
-- gecorrigeerd. Een trigger i.p.v. alleen de kolomgerichte GRANT
-- hierboven, omdat die GRANT zelf geen garantie geeft dat `actief` ook
-- echt het ENIGE gewijzigde veld is in een gegeven update-statement.
create or replace function public.bewaak_subsidie_deadline_integriteit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if NEW.regeling <> OLD.regeling
     or coalesce(NEW.deadline_datum, '0001-01-01'::date) <> coalesce(OLD.deadline_datum, '0001-01-01'::date)
     or coalesce(NEW.budget_status, '') <> coalesce(OLD.budget_status, '')
     or coalesce(NEW.bron_notitie, '') <> coalesce(OLD.bron_notitie, '')
     or NEW.gecontroleerd_op <> OLD.gecontroleerd_op
  then
    raise exception 'Een bevestigde subsidie-deadline kan uitsluitend worden uitgezet (actief), niet inhoudelijk gewijzigd.';
  end if;
  return NEW;
end;
$$;
create trigger subsidie_deadlines_bewaak_integriteit
  before update on public.subsidie_deadlines
  for each row execute function public.bewaak_subsidie_deadline_integriteit();

-- mail_log (0052/0053/0054) had nog geen 'subsidie-deadline'-type.
alter table public.mail_log drop constraint mail_log_type_check;
alter table public.mail_log add constraint mail_log_type_check check (type in ('contact', 'energie-lead', 'energie-confirm', 'mjop', 'jaarrapportage', 'loyaliteitskorting', 'subsidie-deadline'));
