-- Advies en dossierinhoud zijn uitsluitend werk van de adviseur (admin).
--
-- Commercieel uitgangspunt: een klant kan informatie aanleveren en zijn
-- eigen gegevens bekijken, maar het advies — adviespunten, adviesstatus,
-- het afronden van een dossier en de dossierinhoud (snapshots) — is een
-- professioneel product van SMV. Tot nu toe stonden de policies uit
-- 0001_init.sql een klant toe om in zijn eigen open dossier zelf
-- adviespunten aan te maken (ook met herkomst 'automatisch' en een
-- zelfgekozen signaal_bevroren), te wijzigen, te verwijderen, snapshots te
-- overschrijven, het dossier af te ronden en zelf een dossier te openen.
--
-- Deze migration:
--   1. adviespunten: schrijven (insert/update/delete) alleen door een
--      admin. Een klant ziet adviespunten pas zodra de adviseur het
--      dossier heeft afgerond — tot dan zijn het werkaantekeningen van SMV.
--   2. dossiers: aanmaken en wijzigen alleen door een admin, met dezelfde
--      consistentiecheck (pand gekoppeld aan de klant, contactpersoon hoort
--      bij de klant) die eerder alleen voor klanten gold. Lezen blijft
--      ongewijzigd (eigen klant of admin).
--   3. bewaak_adviespunt_integriteit(): controleert nu zowel het oude als
--      het nieuwe dossier. Voorheen keek de trigger bij een UPDATE alleen
--      naar NEW.dossier_id, waardoor een adviespunt uit een afgerond dossier
--      naar een open dossier kon worden verplaatst.
--   4. maak_pand_en_koppel(): ook uitvoerbaar door een admin voor een
--      willekeurige klant, zodat de adviseur panden kan aanleggen zonder
--      dat de klant dat zelf hoeft te doen. Voor klanten verandert niets.
--
-- Bestaande data wordt niet aangeraakt: geen enkele rij wordt gewijzigd of
-- verwijderd, alleen rechten en de trigger-controle.

-- 1. adviespunten --------------------------------------------------------

drop policy adviespunten_select on public.adviespunten;
drop policy adviespunten_insert on public.adviespunten;
drop policy adviespunten_update on public.adviespunten;
drop policy adviespunten_delete on public.adviespunten;

create policy adviespunten_select on public.adviespunten for select
  using (public.is_admin() or exists (
    select 1 from public.dossiers d
    where d.dossier_id = adviespunten.dossier_id
      and d.status = 'afgerond'
      and public.is_member_of_klant(d.klant_id)
  ));
create policy adviespunten_insert_admin on public.adviespunten for insert
  with check (public.is_admin());
create policy adviespunten_update_admin on public.adviespunten for update
  using (public.is_admin())
  with check (public.is_admin());
create policy adviespunten_delete_admin on public.adviespunten for delete
  using (public.is_admin());

-- 2. dossiers ------------------------------------------------------------

drop policy dossiers_insert on public.dossiers;
drop policy dossiers_update on public.dossiers;

create policy dossiers_insert_admin on public.dossiers for insert
  with check (
    public.is_admin()
    and exists (
      select 1 from public.klant_pand_relaties kpr
      where kpr.klant_id = dossiers.klant_id and kpr.pand_id = dossiers.pand_id
    )
    and (primaire_contactpersoon_id is null or exists (
      select 1 from public.contactpersonen cp
      where cp.contactpersoon_id = dossiers.primaire_contactpersoon_id and cp.klant_id = dossiers.klant_id
    ))
  );
create policy dossiers_update_admin on public.dossiers for update
  using (public.is_admin())
  with check (
    public.is_admin()
    and exists (
      select 1 from public.klant_pand_relaties kpr
      where kpr.klant_id = dossiers.klant_id and kpr.pand_id = dossiers.pand_id
    )
    and (primaire_contactpersoon_id is null or exists (
      select 1 from public.contactpersonen cp
      where cp.contactpersoon_id = dossiers.primaire_contactpersoon_id and cp.klant_id = dossiers.klant_id
    ))
  );

-- 3. trigger: oud én nieuw dossier controleren ---------------------------

create or replace function public.bewaak_adviespunt_integriteit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if TG_OP in ('UPDATE', 'DELETE') and exists (
    select 1 from public.dossiers where dossier_id = OLD.dossier_id and status = 'afgerond'
  ) then
    raise exception 'Adviespunten van een afgerond Dossier kunnen niet meer worden gewijzigd.';
  end if;
  if TG_OP in ('INSERT', 'UPDATE') and exists (
    select 1 from public.dossiers where dossier_id = NEW.dossier_id and status = 'afgerond'
  ) then
    raise exception 'Adviespunten van een afgerond Dossier kunnen niet meer worden gewijzigd.';
  end if;
  if TG_OP = 'DELETE' then
    return OLD;
  end if;
  return NEW;
end;
$$;

-- 4. maak_pand_en_koppel: ook voor de admin --------------------------------

create or replace function public.maak_pand_en_koppel(p_klant_id uuid, p_pand jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pand_id uuid;
begin
  if not (public.is_member_of_klant(p_klant_id) or public.is_admin()) then
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
