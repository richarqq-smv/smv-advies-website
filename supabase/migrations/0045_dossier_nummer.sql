-- Dossiernummer + uniforme documentbenoeming (2026-10-12) — aanleiding:
-- offertes/facturen hebben al een herkenbaar, oplopend nummer
-- ("SMV-OFF-2026-0035"/"SMV-FAC-2026-0009"), maar een Dossier zelf heeft
-- er geen — het wordt in de hele admin-UI uitsluitend herkend via
-- "klantnaam + pand-adres". Losse geüploade documenten (uploadDocument())
-- krijgen bovendien gewoon de originele bestandsnaam van de gebruiker,
-- zonder enige SMV-conventie. Dit bestand voegt een dossiernummer toe,
-- exact hetzelfde patroon als offerte_nummer/factuur_nummer (één
-- doorlopende sequence, admin-only gegenereerd, nooit meer te wijzigen),
-- en zorgt dat elk document dat aan een Dossier hangt dat nummer
-- automatisch als voorvoegsel krijgt.

-- ============================================================
-- 1. KOLOM + NUMMERGENERATOR (zelfde patroon als genereer_offerte_nummer()/
--    genereer_factuur_nummer(), zie 0005_offertes.sql/0023_nummergenerator_
--    admin_only.sql) — nullable tot na de backfill hieronder.
-- ============================================================
alter table public.dossiers add column dossier_nummer text;

create sequence public.dossier_nummer_seq;

create or replace function public.genereer_dossier_nummer()
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Alleen SMV kan een dossiernummer genereren.';
  end if;
  return 'SMV-DOS-' || extract(year from now())::text || '-' || lpad(nextval('public.dossier_nummer_seq')::text, 4, '0');
end;
$$;
revoke all on function public.genereer_dossier_nummer() from public, anon;
grant execute on function public.genereer_dossier_nummer() to authenticated;

-- ============================================================
-- 2. BACKFILL bestaande dossiers — oplopend op aanmaakdatum (ouder
--    dossier = lager nummer), los van genereer_dossier_nummer() (die
--    is_admin() vereist, niet beschikbaar in een migratiecontext zonder
--    ingelogde sessie). Jaartal per rij = het jaar van created_at van dát
--    dossier, de doorlopende teller zelf reset niet per jaar — exact
--    dezelfde cosmetische-jaartal-vs-doorlopende-teller-logica als
--    offerte_nummer.
-- ============================================================
with genummerd as (
  select dossier_id, created_at, row_number() over (order by created_at asc) as rij
  from public.dossiers
)
update public.dossiers d
set dossier_nummer = 'SMV-DOS-' || extract(year from g.created_at)::text || '-' || lpad(g.rij::text, 4, '0')
from genummerd g
where g.dossier_id = d.dossier_id;

-- Sequence verder laten lopen na het hoogste backfill-nummer, zodat een
-- nieuw dossier nooit kan botsen met een bestaand nummer.
select setval('public.dossier_nummer_seq', (select count(*) from public.dossiers));

alter table public.dossiers alter column dossier_nummer set not null;
alter table public.dossiers add constraint dossiers_dossier_nummer_key unique (dossier_nummer);
alter table public.dossiers alter column dossier_nummer set default public.genereer_dossier_nummer();

-- ============================================================
-- 3. IMMUTABILITEIT — dossier_nummer mag, net als offerte_nummer, nooit
--    meer wijzigen nadat het is toegekend, ook niet door een admin.
--    bewaak_dossier_integriteit() wordt hier opnieuw gedefinieerd met
--    exact dezelfde inhoud als de huidige, live staat (0020_account_
--    security_hardening.sql + 0041_dossier_heropenen.sql), uitsluitend
--    uitgebreid met de nieuwe check.
-- ============================================================
create or replace function public.bewaak_dossier_integriteit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if NEW.dossier_nummer <> OLD.dossier_nummer then
    raise exception 'Het dossiernummer kan niet worden gewijzigd.';
  end if;

  if OLD.status = 'afgerond' then
    if not public.is_admin() then
      raise exception 'Een afgerond Dossier kan niet meer worden gewijzigd.';
    end if;
    if NEW.status <> 'open'
       or NEW.klant_id <> OLD.klant_id
       or NEW.pand_id <> OLD.pand_id
       or coalesce(NEW.gearchiveerd_op, 'epoch'::timestamptz) <> coalesce(OLD.gearchiveerd_op, 'epoch'::timestamptz)
       or NEW.gearchiveerd_via_klant <> OLD.gearchiveerd_via_klant
       or coalesce(NEW.primaire_contactpersoon_id, '00000000-0000-0000-0000-000000000000'::uuid)
          <> coalesce(OLD.primaire_contactpersoon_id, '00000000-0000-0000-0000-000000000000'::uuid)
       or NEW.pand_snapshot is distinct from OLD.pand_snapshot
       or NEW.contactpersoon_snapshot is distinct from OLD.contactpersoon_snapshot
       or NEW.mjop_snapshot is distinct from OLD.mjop_snapshot
       or coalesce(NEW.pakket_id, '') <> coalesce(OLD.pakket_id, '')
       or NEW.bouwkundige_analyse is distinct from OLD.bouwkundige_analyse
    then
      raise exception 'Een afgerond Dossier kan uitsluitend worden heropend (status terug naar open) — daarbij mag verder niets anders wijzigen.';
    end if;
    return NEW;
  end if;

  if NEW.klant_id <> OLD.klant_id or NEW.pand_id <> OLD.pand_id then
    raise exception 'De klant- of pandkoppeling van een Dossier kan niet worden gewijzigd.';
  end if;

  if not public.is_admin() then
    if NEW.status <> OLD.status
       or coalesce(NEW.gearchiveerd_op, 'epoch'::timestamptz) <> coalesce(OLD.gearchiveerd_op, 'epoch'::timestamptz)
       or NEW.gearchiveerd_via_klant <> OLD.gearchiveerd_via_klant
       or coalesce(NEW.primaire_contactpersoon_id, '00000000-0000-0000-0000-000000000000'::uuid)
          <> coalesce(OLD.primaire_contactpersoon_id, '00000000-0000-0000-0000-000000000000'::uuid)
       or NEW.pand_snapshot is distinct from OLD.pand_snapshot
       or NEW.contactpersoon_snapshot is distinct from OLD.contactpersoon_snapshot
       or NEW.mjop_snapshot is distinct from OLD.mjop_snapshot
       or coalesce(NEW.pakket_id, '') <> coalesce(OLD.pakket_id, '')
       or NEW.bouwkundige_analyse is distinct from OLD.bouwkundige_analyse
    then
      raise exception 'Deze wijziging aan het dossier is uitsluitend voor SMV beschikbaar.';
    end if;
  end if;

  return NEW;
end;
$$;
-- Trigger zelf (naam/timing) bestaat al sinds 0001_init.sql — alleen de
-- functie-inhoud is hierboven vervangen, geen create trigger nodig.

-- ============================================================
-- 4. UNIFORME DOCUMENTBENOEMING — een document dat aan een Dossier hangt
--    (documenten.dossier_id) krijgt het dossiernummer automatisch als
--    voorvoegsel, ongeacht welk upload-pad het aanlevert (handmatige
--    upload via Account.jsx/admin, of een automatisch gegenereerd
--    rapport). Idempotent: een bestandsnaam die al met "SMV-DOS-" begint
--    (de .docx-generators zetten dat zelf al in de bestandsnaam, zie
--    adviesrapportDocx.js/subsidieDocumentDocx.js) wordt niet dubbel
--    voorzien van een voorvoegsel.
-- ============================================================
create or replace function public.benoem_document_met_dossiernummer()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_dossier_nummer text;
begin
  if NEW.dossier_id is not null and NEW.bestandsnaam !~ '^SMV-DOS-' then
    select dossier_nummer into v_dossier_nummer from public.dossiers where dossier_id = NEW.dossier_id;
    if v_dossier_nummer is not null then
      NEW.bestandsnaam := v_dossier_nummer || '_' || NEW.bestandsnaam;
    end if;
  end if;
  return NEW;
end;
$$;
create trigger documenten_benoem_met_dossiernummer
before insert on public.documenten
for each row execute function public.benoem_document_met_dossiernummer();
