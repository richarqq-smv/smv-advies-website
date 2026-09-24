/**
 * Advieslaag: het Adviespunt is het enige nieuwe concept van de advieslaag
 * en leeft als additief veld (`adviespunten`) op het bestaande Dossier — zie
 * dossier.js. Geen nieuwe storage-entiteit (ontwerpdocument "De advieslaag
 * van SMV Advies" + de readiness review daarop).
 *
 * Hergebruikt de bestaande MJOP-statussen (lib/mjop/constants.js) in plaats
 * van een tweede, inhoudelijk identieke statuslijst te definiëren. Dezelfde
 * status kan dus voorkomen als automatisch MJOP-signaal én als definitief
 * advies — het onderscheid zit in `herkomst`/`signaalBevroren`, niet in een
 * aparte statuslijst.
 *
 * Er is bewust geen "vastgesteldDoorAdviseur"-boolean (readiness review,
 * Focus 3): een adviespunt komt uitsluitend in `adviespunten[]` terecht
 * omdat Richard er bewust voor koos het toe te voegen — dat bestaan ÍS de
 * vaststelling. Er is ook bewust geen `brongegevensRef` (dubbelop met
 * `signaalBevroren`) en geen `afhankelijkVan` (uitgesteld naar V2, geen
 * concreet gebruik in dit ontwerp).
 */
import { generateId } from './id.js'
import { STATUSES } from '../mjop/constants.js'

// Vaste, minimale vorm van een bevroren automatisch signaal — uitsluitend
// deze vijf velden (readiness review, Focus 1/6). Nooit de bijbehorende
// MEASURES-tekst of andere uitgebreide maatregeldata: dat blijft
// MJOP-kennislaag, geen duplicaat in de advieslaag.
const SIGNAAL_BEVROREN_FIELDS = ['componentId', 'componentLabel', 'status', 'statusLabel', 'relevantYear']

/**
 * Bouwt de bevroren signaalkopie uit een MJOP-insight (het resultaat van
 * deriveComponentInsight()/buildInsights() in lib/mjop/linking.js). Puur
 * een waardekopie op het moment van aanmaken — geen enkele live referentie
 * naar het bouwdeel of de MJOP-building, zodat een later afgerond Dossier
 * nooit indirect kan veranderen doordat de MJOP-data verandert (Focus 6/9
 * uit de readiness review).
 */
export function createSignaalBevroren(insight) {
  if (!insight) throw new Error('createSignaalBevroren vereist een insight (het resultaat van deriveComponentInsight()).')
  const snapshot = {}
  for (const field of SIGNAAL_BEVROREN_FIELDS) snapshot[field] = insight[field] ?? null
  return Object.freeze(snapshot)
}

function isValidAdviesStatus(status) {
  return typeof status === 'string' && status in STATUSES
}

/**
 * Maakt een nieuw Adviespunt. `onderwerp` en `toelichting` zijn altijd
 * verplicht (readiness review, correctie B) — ook bij "geen actie nodig" of
 * "onvoldoende informatie": dat zijn volwaardige uitkomsten, geen lege
 * velden.
 *
 * Bij `herkomst: 'automatisch'` is `signaalBevroren` verplicht (dat is
 * precies het bewaarde spoor van het automatische signaal); bij
 * `herkomst: 'handmatig'` blijft het altijd `null` — er is dan geen
 * automatisch signaal om te bevriezen.
 */
export function createAdviespunt({ onderwerp, herkomst, adviesStatus, toelichting, herbeoordelenBij = null, signaalBevroren = null } = {}) {
  if (!onderwerp?.trim()) throw new Error('createAdviespunt vereist een onderwerp.')
  if (herkomst !== 'automatisch' && herkomst !== 'handmatig') {
    throw new Error("createAdviespunt vereist herkomst 'automatisch' of 'handmatig'.")
  }
  if (!isValidAdviesStatus(adviesStatus)) {
    throw new Error('createAdviespunt vereist een geldige adviesStatus (zie lib/mjop/constants.js STATUSES).')
  }
  if (!toelichting?.trim()) throw new Error('createAdviespunt vereist een toelichting.')
  if (herkomst === 'automatisch' && !signaalBevroren) {
    throw new Error("createAdviespunt vereist signaalBevroren bij herkomst 'automatisch'.")
  }
  if (herkomst === 'handmatig' && signaalBevroren) {
    throw new Error("createAdviespunt staat geen signaalBevroren toe bij herkomst 'handmatig'.")
  }

  const now = new Date().toISOString()
  // Zelfde patroon als createPandSnapshot()/createContactpersoonSnapshot():
  // direct bevroren bij aanmaken, niet pas bij het (opnieuw) laden uit
  // storage — een wijziging gaat altijd via updateAdviespunt(), dat een
  // nieuw, eveneens bevroren object teruggeeft.
  return Object.freeze({
    adviespuntId: generateId(),
    onderwerp: onderwerp.trim(),
    herkomst,
    // Al bevroren door createSignaalBevroren(); hier nogmaals defensief
    // gekopieerd/bevroren voor het geval een aanroeper zelf een plain
    // object meegeeft.
    signaalBevroren: signaalBevroren ? Object.freeze({ ...signaalBevroren }) : null,
    adviesStatus,
    toelichting: toelichting.trim(),
    herbeoordelenBij: herbeoordelenBij?.trim() || null,
    aangemaaktOp: now,
    laatstGewijzigd: now,
  })
}
