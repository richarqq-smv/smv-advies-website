/**
 * Lokale opslag voor de MJOP-tool. V1 bewaart één actief pandprofiel in
 * localStorage — geen backend, geen account. Meerdere panden kunnen worden
 * beheerd via JSON-export/import (zie importExport.js): exporteer het
 * huidige pand, wis de tool, werk aan het volgende pand, en importeer het
 * vorige pand later terug wanneer nodig. Dat hield de kernfunctionaliteit
 * eenvoudig en betrouwbaar zonder een lijst-/wisselmechanisme te bouwen dat
 * er in V1 niet toe doet (zie opdracht sectie 21 en de prioriteitsvolgorde
 * in sectie 49).
 *
 * V1.1: de 12 standaardonderdelen (STANDARD_COMPONENT_TYPES) staan vanaf nu
 * altijd al in `components` — een nieuw pand hoeft niet eerst onderdelen
 * toegevoegd te krijgen voordat er iets ingevuld kan worden. Een
 * standaardonderdeel gebruikt zijn eigen `typeId` als `id` (uniek en
 * voorspelbaar), zodat het rechtstreeks kan worden opgezocht en bijgewerkt.
 * Alleen "Anders, namelijk..." blijft een losse, door de gebruiker
 * toegevoegde uitzondering met een gegenereerd id.
 */
import { STANDARD_COMPONENT_TYPES } from './constants'

export const SCHEMA_VERSION = 1
const STORAGE_KEY = 'smv_mjop_building_v1'

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function createEmptyComponent(typeId = null) {
  return {
    id: typeId && typeId !== 'anders' ? typeId : generateId(),
    typeId,
    // 'ja' | 'nee' | 'onbekend' — of dit onderdeel aanwezig is in het pand.
    present: 'onbekend',
    customLabel: '',
    currentSituation: '',
    installationYear: null,
    expectedLifetime: null,
    maintenanceYear: null,
    replacementYear: null,
    notes: '',
  }
}

export function createEmptyBuilding() {
  const now = new Date().toISOString()
  return {
    schemaVersion: SCHEMA_VERSION,
    id: generateId(),
    name: '',
    location: '',
    constructionYear: null,
    buildingUse: null,
    floorArea: null,
    floors: null,
    occupants: null,
    notes: '',
    energy: {
      gasConsumption: null,
      electricityConsumption: null,
      energySource: null,
      heatingSystem: null,
      energyLabel: null,
    },
    components: STANDARD_COMPONENT_TYPES.map((t) => createEmptyComponent(t.id)),
    // Optionele contactgegevens, alleen gebruikt bij het versturen van de
    // analyse naar SMV Advies (stap 7) — nooit verplicht.
    contact: { naam: '', email: '', telefoon: '' },
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Vult ontbrekende standaardonderdelen aan zonder bestaande data te raken.
 * Nodig voor pandprofielen die al bestonden vóór V1.1 (localStorage) of via
 * JSON-import binnenkomen, zodat stap 3/4 altijd de volledige, voorspelbare
 * set van 12 kaarten tonen, met de eventueel al ingevulde gegevens intact.
 */
export function ensureStandardComponents(building) {
  const existingIds = new Set((building.components ?? []).map((c) => c.id))
  const missing = STANDARD_COMPONENT_TYPES.filter((t) => !existingIds.has(t.id)).map((t) => createEmptyComponent(t.id))
  if (missing.length === 0) return building
  return { ...building, components: [...(building.components ?? []), ...missing] }
}

/**
 * Leest het opgeslagen pandprofiel. Geeft `null` terug bij afwezigheid of
 * corrupte data (nooit een fout die de tool blokkeert) — localStorage kan
 * altijd falen (privémodus, volle quota, geblokkeerde site-data), dus elke
 * toegang staat in een try/catch.
 */
export function loadBuilding() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.components)) return null
    return ensureStandardComponents(parsed)
  } catch {
    return null
  }
}

export function saveBuilding(building) {
  try {
    const toSave = { ...building, schemaVersion: SCHEMA_VERSION, updatedAt: new Date().toISOString() }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    return true
  } catch {
    // Opslaan kan mislukken (bijv. privénavigatie); de tool blijft dan
    // gewoon werken binnen de huidige sessie, alleen zonder persistentie.
    return false
  }
}

export function clearBuilding() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
