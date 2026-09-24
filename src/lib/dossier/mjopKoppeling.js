/**
 * Tussenstap-koppeling tussen de actieve MJOP-building en het Pand +
 * MJOP-momentopname die daarvoor is opgeslagen. Bewust nog geen Dossier:
 * het bestaande createDossier() (dossier.js) vereist een echte Klant met
 * klantId, en deze stap maakt expliciet geen Klant aan (architectuurbesluit
 * naar aanleiding van dat conflict — zie de projectgeschiedenis). Deze
 * koppeling bewaart dus alleen wat nu al zeker is: welk Pand bij deze
 * MJOP-building hoort, en wat de laatst opgeslagen MJOP-invoer was.
 *
 * Later, zodra er een bewuste Klant-koppeling bestaat, kan de hier
 * bewaarde mjopSnapshot rechtstreeks worden hergebruikt als de
 * MJOP-momentopname van een dan pas aan te maken Dossier — deze koppeling
 * hoeft daarvoor niet te worden herontworpen, alleen uitgebreid met een
 * dossierId zodra die bestaat.
 *
 * Eén vaste sleutel, geen collectie: MJOP V1 kent maar één actief
 * pandprofiel tegelijk (zie lib/mjop/storage.js), dus is er nooit meer dan
 * één koppeling relevant. `smv_mjop_building_v1` zelf wordt door dit
 * bestand nooit gelezen of geschreven — alleen de meegegeven `building`
 * (uit de React-state van de tool) wordt gebruikt.
 */
import { createPand, updatePand } from './pand.js'
import { savePand, loadPand, deletePand } from './storage.js'
import { mjopBuildingToDossierInput } from './mjopAdapter.js'

const MJOP_KOPPELING_KEY = 'smv_dossier_mjopKoppeling_v1'

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function deepFreeze(value) {
  if (Array.isArray(value)) {
    value.forEach(deepFreeze)
    return Object.freeze(value)
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    return Object.freeze(value)
  }
  return value
}

function isValidKoppeling(value) {
  return (
    isPlainObject(value) &&
    typeof value.mjopBuildingId === 'string' &&
    value.mjopBuildingId.length > 0 &&
    typeof value.pandId === 'string' &&
    value.pandId.length > 0 &&
    isPlainObject(value.mjopSnapshot)
  )
}

/** Geeft de koppeling voor deze mjopBuildingId terug, of `null`. Verwerpt corrupte of verkeerd gevormde data stilzwijgend, net als storage.js. */
function loadMjopKoppeling(mjopBuildingId) {
  try {
    const raw = globalThis.localStorage.getItem(MJOP_KOPPELING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!isValidKoppeling(parsed)) return null
    if (parsed.mjopBuildingId !== mjopBuildingId) return null
    return { ...parsed, mjopSnapshot: deepFreeze({ ...parsed.mjopSnapshot }) }
  } catch {
    return null
  }
}

function saveMjopKoppelingRecord(koppeling) {
  if (!isValidKoppeling(koppeling)) {
    throw new Error('Ongeldige koppeling: mjopBuildingId, pandId en mjopSnapshot zijn verplicht.')
  }
  try {
    globalThis.localStorage.setItem(MJOP_KOPPELING_KEY, JSON.stringify(koppeling))
    return true
  } catch {
    return false
  }
}

/**
 * Slaat de actuele MJOP-situatie op als Pand + MJOP-momentopname. Maakt
 * uitdrukkelijk geen Klant en geen Dossier aan. Bij een herhaalde aanroep
 * voor dezelfde MJOP-building (via de bestaande koppeling) wordt het al
 * bestaande Pand bijgewerkt in plaats van een nieuw Pand aan te maken, en
 * wordt de MJOP-momentopname vervangen door de actuele situatie.
 *
 * Volgorde bewust: eerst het Pand opslaan, dan pas de koppeling. Mislukt
 * het opslaan van het Pand, dan gebeurt er verder niets. Mislukt alleen de
 * koppeling, dan wordt een in déze aanroep nieuw aangemaakt Pand weer
 * verwijderd (rollback); een al bestaand, bijgewerkt Pand blijft staan —
 * dat is geen half opgeslagen toestand, alleen een koppeling die nog niet
 * is ververst.
 */
export function saveMjopSnapshotToPand(building) {
  const { pandInput, mjopSnapshot } = mjopBuildingToDossierInput(building)
  const bestaandeKoppeling = loadMjopKoppeling(building.id)

  let pand
  let isNieuwPand
  if (bestaandeKoppeling) {
    const bestaandPand = loadPand(bestaandeKoppeling.pandId)
    isNieuwPand = !bestaandPand
    pand = bestaandPand ? updatePand(bestaandPand, pandInput) : createPand(pandInput)
  } else {
    isNieuwPand = true
    pand = createPand(pandInput)
  }

  if (!savePand(pand)) {
    throw new Error('Het Pand kon niet worden opgeslagen.')
  }

  const koppelingOpgeslagen = saveMjopKoppelingRecord({
    mjopBuildingId: building.id,
    pandId: pand.pandId,
    mjopSnapshot,
    savedAt: new Date().toISOString(),
  })

  if (!koppelingOpgeslagen) {
    if (isNieuwPand) deletePand(pand.pandId)
    throw new Error('De koppeling tussen MJOP en het Pand kon niet worden opgeslagen.')
  }

  return { pand, mjopSnapshot }
}
