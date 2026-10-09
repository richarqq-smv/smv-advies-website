-- Admin-UX-ronde (2026-10-09, UX-auditrapport §4): "Factuur maken" in
-- OffertesHistorie.jsx controleerde nergens de status van de gekoppelde
-- offerte — een admin kon zo een factuur aanmaken vanuit een offerte die
-- nog 'concept' is (nooit verstuurd) of al 'afgewezen'/'geannuleerd'. De
-- UI-knop wordt in deze ronde ook aangepast (zie OffertesHistorie.jsx),
-- maar de frontend is geen beveiligingsgrens (zie SECURITY_MODEL.md) —
-- deze trigger is de echte, niet te omzeilen handhaving, exact hetzelfde
-- patroon als de al bestaande bewaak_offerte_integriteit()/
-- bewaak_factuur_integriteit() (0005_offertes.sql/0014_facturen.sql),
-- maar die twee bewaken allebei alleen UPDATE-overgangen van hun eigen
-- tabel — geen van beide checkt de offerte-status op het moment van een
-- nieuwe factuur-INSERT.
create or replace function public.bewaak_factuur_offerte_status()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_offerte_status text;
begin
  if NEW.offerte_id is not null then
    select status into v_offerte_status from public.offertes where id = NEW.offerte_id;
    if v_offerte_status is null then
      raise exception 'De gekoppelde offerte bestaat niet.';
    end if;
    if v_offerte_status not in ('verstuurd', 'geaccepteerd') then
      raise exception 'Een factuur kan alleen worden aangemaakt vanuit een offerte met status "verstuurd" of "geaccepteerd" (huidige status: "%").', v_offerte_status;
    end if;
  end if;
  return NEW;
end;
$$;

create trigger facturen_bewaak_offerte_status
before insert on public.facturen
for each row execute function public.bewaak_factuur_offerte_status();
