-- Productworkflow-analyseronde — aanleiding: geen enkel dossier weet
-- momenteel welk pakket (QuickScan/Premium/Gold) het betreft. `pakket_id`
-- bestaat alleen op `offertes` (een latere, aparte commerciële
-- voorstel-laag) — dat is niet hetzelfde moment: een dossier wordt al
-- geopend zodra een klant/adviseur begint, een offerte volgt vaak pas
-- later (of hoort bij een heel ander vervolgtraject). Zonder een eigen
-- veld op `dossiers` kan niets in de applicatie automatisch de juiste
-- workflow/rapportknop/pakketgrens tonen — dat dwingt de adviseur nu bij
-- elke rapportgeneratie opnieuw handmatig te kiezen. Business-beslissing
-- bevestigd door de klant: "nog te bepalen" (NULL) moet mogelijk blijven,
-- maar zodra het bekend is, is dit de bron van waarheid.
alter table public.dossiers
  add column pakket_id text check (pakket_id is null or pakket_id in ('basis', 'premium', 'gold'));

comment on column public.dossiers.pakket_id is 'Welk pakket dit dossier betreft (matcht src/data/packages.js-id''s) — NULL = nog te bepalen. Bron van waarheid voor workflow/rapportkeuze/pakketgrenzen; klant kan dit bij dossieraanmaak meegeven, wijzigen na aanmaak is admin-only (bewaak_dossier_integriteit dekt dat al, zelfde patroon als overige kolommen).';

-- ============================================================
-- GOLD-PAKKETGRENS: maximaal 3 adviespunten per Gold-dossier
-- ============================================================
--
-- packages.js zegt letterlijk "Maximaal 3 geselecteerde maatregelen" voor
-- Gold. Zonder handhaving zou een adviseur per ongeluk een vierde
-- definitief adviespunt kunnen vastleggen, terwijl het rapport er toch
-- maar 3 toont — inhoudelijk inconsistent. Zelfde architectuurpatroon als
-- bewaak_offerte_integriteit/bewaak_dossier_integriteit: een tweede,
-- onafhankelijke laag naast RLS, hier als BEFORE INSERT-check. Geen
-- SECURITY DEFINER nodig: adviespunten_insert (RLS) staat toch al alleen
-- is_admin() toe, en een admin mag dossiers al lezen via dossiers_select.
create or replace function public.bewaak_adviespunten_pakketlimiet()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_pakket_id text;
  v_aantal int;
begin
  select pakket_id into v_pakket_id from public.dossiers where dossier_id = NEW.dossier_id;

  if v_pakket_id = 'gold' then
    select count(*) into v_aantal from public.adviespunten where dossier_id = NEW.dossier_id;
    if v_aantal >= 3 then
      raise exception 'Dit Gold-dossier heeft al 3 adviespunten — Gold biedt maximaal 3 geselecteerde maatregelen.';
    end if;
  end if;

  return NEW;
end;
$$;

create trigger adviespunten_bewaak_pakketlimiet
before insert on public.adviespunten
for each row execute function public.bewaak_adviespunten_pakketlimiet();
