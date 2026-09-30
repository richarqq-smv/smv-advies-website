-- Rc/U-waarden voor de bouwkundige analyse (Premium/Gold-rapporttabel) —
-- aanleiding: de template vraagt per vast bouwdeel (gevel/dak/vloer/
-- beglazing) een geschatte huidige Rc- of U-waarde, een beoordeling en een
-- opmerking. De vaste "eis"-tekst per bouwdeel verandert nooit per dossier
-- (staat al vast in het sjabloon) en wordt dus niet opgeslagen.
--
-- Bewust GEEN uitbreiding van mjop_snapshot.components: die component-
-- structuur wordt gedeeld met de publieke, klant-zelfbedienings MJOP-Tool
-- (zie StepBouwdelen.jsx, ook zichtbaar op /MJOP-Tool zonder dossier). Een
-- Rc/U-waarde is een vakinhoudelijke inschatting die uitsluitend door de
-- adviseur tijdens een betaalde Premium/Gold-opname wordt vastgesteld —
-- dat hoort dus bij de dossier-eigen, admin-only data (zelfde plek als
-- pand_snapshot/mjop_snapshot als geheel), niet in het gedeelde publieke
-- wizard-datamodel.
--
-- Eén vlakke jsonb, sleutel = vaste bouwdeel-categorie ('gevel'|'dak'|
-- 'vloer'|'beglazing' — exact de 4 rijen uit de template met een echte
-- Rc/U-kolom; de 5e rij "Installaties" heeft in de template vaste
-- "n.v.t."-waarden en blijft buiten deze structuur). Geen eigen tabel:
-- vier vaste rijen zijn geen relationele collectie, zelfde overweging als
-- destijds bij pand_snapshot.
alter table public.dossiers
  add column bouwkundige_analyse jsonb check (bouwkundige_analyse is null or jsonb_typeof(bouwkundige_analyse) = 'object');

comment on column public.dossiers.bouwkundige_analyse is 'Optioneel, vakinhoudelijk door de adviseur ingevuld tijdens Premium/Gold-opname. Vorm: {"gevel"|"dak"|"vloer"|"beglazing": {"waarde": text, "eenheid": "Rc"|"U", "beoordeling": text, "opmerking": text}}. Nooit automatisch berekend of geschat.';
