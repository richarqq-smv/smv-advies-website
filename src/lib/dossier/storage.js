/**
 * Lokale opslag voor de Klant/Pand/Dossier-domeinmodule. Zelfde
 * uitgangspunt als src/lib/mjop/storage.js (localStorage, geen backend,
 * elke toegang in een try/catch omdat opslag altijd kan falen), maar met
 * een eigen, duidelijk genamespacete sleutelset per entiteitstype zodat
 * dossierdata nooit kan botsen met de bestaande MJOP- of Energie-
 * indicatie-opslag (die overigens zelf niets opslaat).
 *
 * Elk type wordt bewaard als één JSON-object { [id]: record } onder één
 * sleutel — voldoende voor de huidige schaal (lokaal, geen account) en
 * eenvoudiger dan een sleutel per record.
 *
 * Gebruikt bewust `globalThis.localStorage` in plaats van
 * `window.localStorage`: in de browser is dat identiek (window ===
 * globalThis), maar het maakt deze module ook testbaar onder de kale
 * Node-testrunner door in tests een minimale in-memory vervanger op
 * `globalThis.localStorage` te zetten, zonder een testdependency zoals
 * jsdom nodig te hebben.
 */
import { DOSSIER_STATUS } from './dossier.js'

export const SCHEMA_VERSION = 1

const KLANTEN_KEY = 'smv_dossier_klanten_v1'
const PANDEN_KEY = 'smv_dossier_panden_v1'
const DOSSIERS_KEY = 'smv_dossier_dossiers_v1'

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Lichte structurele validatie — geen volledige schemacontrole, alleen
 * genoeg om te voorkomen dat een willekeurig of corrupt object stilzwijgend
 * als geldige Klant/Pand/Dossier wordt behandeld. Bij twijfel: afwijzen,
 * nooit ontbrekende velden verzinnen.
 */
function isValidKlant(value) {
  return isPlainObject(value) && typeof value.klantId === 'string' && value.klantId.length > 0 && Array.isArray(value.contactpersonen)
}

function isValidPand(value) {
  return isPlainObject(value) && typeof value.pandId === 'string' && value.pandId.length > 0
}

function isValidDossier(value) {
  return (
    isPlainObject(value) &&
    typeof value.dossierId === 'string' &&
    value.dossierId.length > 0 &&
    typeof value.klantId === 'string' &&
    value.klantId.length > 0 &&
    typeof value.pandId === 'string' &&
    value.pandId.length > 0 &&
    (value.status === DOSSIER_STATUS.OPEN || value.status === DOSSIER_STATUS.AFGEROND) &&
    isPlainObject(value.pandSnapshot)
  )
}

/**
 * Leest een collectie en filtert stilzwijgend alles wat niet aan de
 * verwachte vorm voldoet — corrupte JSON, een leeg record, of data van een
 * heel ander type onder dezelfde sleutel levert nooit een crash op, alleen
 * een kleinere (of lege) collectie.
 */
function readCollection(key, isValid) {
  try {
    const raw = globalThis.localStorage.getItem(key)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!isPlainObject(parsed)) return {}
    const result = {}
    for (const [id, record] of Object.entries(parsed)) {
      if (isValid(record)) result[id] = record
    }
    return result
  } catch {
    return {}
  }
}

function writeCollection(key, collection) {
  try {
    globalThis.localStorage.setItem(key, JSON.stringify(collection))
    return true
  } catch {
    // Opslaan kan mislukken (privénavigatie, volle quota); de aanroeper
    // krijgt dat terug als `false` in plaats van een geworpen fout.
    return false
  }
}

/**
 * Een Dossier verliest bij JSON.stringify/parse zijn Object.freeze — dat is
 * puur een JavaScript-runtime-eigenschap, geen opgeslagen data. Na het
 * teruglezen wordt dezelfde bevriezing opnieuw toegepast: de snapshot blijft
 * altijd bevroren, en een afgerond Dossier wordt in zijn geheel opnieuw
 * bevroren — precies het gedrag van completeDossier() in dossier.js, hier
 * hergebruikt in plaats van opnieuw gedefinieerd. De snapshot-inhoud zelf
 * wordt hierbij niet aangeraakt of opnieuw afgeleid van een Pand-object: wat
 * is opgeslagen, is wat wordt teruggegeven.
 */
function rehydrateDossier(raw) {
  const pandSnapshot = Object.freeze({ ...raw.pandSnapshot })
  const dossier = { ...raw, pandSnapshot }
  return dossier.status === DOSSIER_STATUS.AFGEROND ? Object.freeze(dossier) : dossier
}

// --- Klant ------------------------------------------------------------

export function saveKlant(klant) {
  if (!isValidKlant(klant)) throw new Error('saveKlant vereist een geldig Klant-object (klantId + contactpersonen-array).')
  const all = readCollection(KLANTEN_KEY, isValidKlant)
  all[klant.klantId] = klant
  return writeCollection(KLANTEN_KEY, all)
}

export function loadKlant(klantId) {
  return readCollection(KLANTEN_KEY, isValidKlant)[klantId] ?? null
}

export function loadAllKlanten() {
  return Object.values(readCollection(KLANTEN_KEY, isValidKlant))
}

export function deleteKlant(klantId) {
  const all = readCollection(KLANTEN_KEY, isValidKlant)
  if (!(klantId in all)) return false
  delete all[klantId]
  return writeCollection(KLANTEN_KEY, all)
}

// --- Pand ---------------------------------------------------------------

export function savePand(pand) {
  if (!isValidPand(pand)) throw new Error('savePand vereist een geldig Pand-object (pandId).')
  const all = readCollection(PANDEN_KEY, isValidPand)
  all[pand.pandId] = pand
  return writeCollection(PANDEN_KEY, all)
}

export function loadPand(pandId) {
  return readCollection(PANDEN_KEY, isValidPand)[pandId] ?? null
}

export function loadAllPanden() {
  return Object.values(readCollection(PANDEN_KEY, isValidPand))
}

export function deletePand(pandId) {
  const all = readCollection(PANDEN_KEY, isValidPand)
  if (!(pandId in all)) return false
  delete all[pandId]
  return writeCollection(PANDEN_KEY, all)
}

// --- Dossier --------------------------------------------------------------

export function saveDossier(dossier) {
  if (!isValidDossier(dossier)) throw new Error('saveDossier vereist een geldig Dossier-object.')
  const all = readCollection(DOSSIERS_KEY, isValidDossier)
  all[dossier.dossierId] = dossier
  return writeCollection(DOSSIERS_KEY, all)
}

export function loadDossier(dossierId) {
  const raw = readCollection(DOSSIERS_KEY, isValidDossier)[dossierId]
  return raw ? rehydrateDossier(raw) : null
}

export function loadAllDossiers() {
  return Object.values(readCollection(DOSSIERS_KEY, isValidDossier)).map(rehydrateDossier)
}

export function deleteDossier(dossierId) {
  const all = readCollection(DOSSIERS_KEY, isValidDossier)
  if (!(dossierId in all)) return false
  delete all[dossierId]
  return writeCollection(DOSSIERS_KEY, all)
}
