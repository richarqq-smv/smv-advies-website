/**
 * Koppelt een opname-onderdeel (lib/klantOmgeving/opname.js,
 * OPNAME_ONDERDELEN) aan de subsidiemaatregel(en) waarvoor dat onderdeel
 * de natuurlijke, eenmalige invoerplek is — zodat de adviseur de
 * subsidie-specifieke velden (oppervlakte/Rd-of-U-waarde/meldcode/
 * "aangebracht?") tijdens de opname zelf invult, in plaats van later nog
 * een keer op de subsidiepagina (opdracht: "gegevens één keer invoeren
 * en daarna hergebruiken").
 *
 * Bewust GEEN automatische interpretatie van de bestaande vrije-tekst-
 * waarnemingsvelden (huidige_situatie/maatvoering/mogelijke_maatregel) —
 * die blijven puur ter referentie (zie subsidieDocumentData.js's
 * opnameReferentie()). Dit bestand voegt alleen de KOPPELING toe van
 * welk onderdeel bij welke maatregel hoort; de daadwerkelijke
 * subsidievelden blijven een expliciete, losstaande invoer
 * (dossier_subsidie_specificaties), nooit afgeleid uit tekst.
 *
 * Eén onderdeel kan bij meerdere maatregelen horen (bv. "vloer" dekt
 * zowel vloerisolatie als bodemisolatie, "glas" zowel HR++ als triple,
 * "warmtepomp" zowel hybride als elektrisch) — dat zijn in de RVO-regels
 * echt verschillende maatregelen met eigen tarief/voorwaarden, dus nooit
 * samengevoegd tot één veldenset.
 */
export const ONDERDEEL_NAAR_MAATREGELEN = {
  dak: ['dakisolatie'],
  gevel: ['gevelisolatie'],
  vloer: ['vloerisolatie', 'bodemisolatie'],
  glas: ['glasHrpp', 'glasTriple'],
  warmtepomp: ['warmtepomp_hybride', 'warmtepomp_elektrisch'],
  warmtapwater: ['zonneboiler'],
  ventilatie: ['ventilatie'],
}

/** Maatregel-keys die bij ISOLATIE horen (oppervlakte + Rd/U-waarde + meldcode) — zie isdeIsolatieRegels.js. */
export const ISOLATIE_MAATREGEL_KEYS = new Set(['dakisolatie', 'gevelisolatie', 'vloerisolatie', 'bodemisolatie', 'glasHrpp', 'glasTriple'])
/** Maatregel-keys die bij APPARATEN horen (meldcode + adviseur-ingevoerd bedrag + bron-URL) — zie isdeApparaatRegels.js. */
export const APPARAAT_MAATREGEL_KEYS = new Set(['warmtepomp_hybride', 'warmtepomp_elektrisch', 'zonneboiler'])
/** Ventilatie is een eigen, derde vorm (vast bedrag, geen oppervlakte, geen adviseur-ingevoerd bedrag) — zie isdeVentilatieRegel.js. */
export const VENTILATIE_MAATREGEL_KEY = 'ventilatie'

/** Geeft de maatregel-keys voor dit opname-onderdeel, of een lege lijst als dit onderdeel geen subsidiemaatregel heeft (bv. "meterkast", "verbruik"). */
export function maatregelenVoorOnderdeel(onderdeelCode) {
  return ONDERDEEL_NAAR_MAATREGELEN[onderdeelCode] ?? []
}

/** Bepaalt welk type invoerveldenset een maatregel-key nodig heeft — 'isolatie' | 'apparaat' | 'ventilatie' | null (onbekende key). */
export function maatregelSoort(maatregelKey) {
  if (ISOLATIE_MAATREGEL_KEYS.has(maatregelKey)) return 'isolatie'
  if (APPARAAT_MAATREGEL_KEYS.has(maatregelKey)) return 'apparaat'
  if (maatregelKey === VENTILATIE_MAATREGEL_KEY) return 'ventilatie'
  return null
}

/** Alle maatregel-keys die via ÉÉN of ander opname-onderdeel bereikbaar zijn — gebruikt om de koppeling tegen de engine te toetsen (zie test). */
export function ONDERSTEUNDE_MAATREGELEN_UIT_KOPPELING() {
  return Object.values(ONDERDEEL_NAAR_MAATREGELEN).flat()
}
