import { SCHEMA_VERSION, createEmptyBuilding, createEmptyComponent } from './storage'

/** Bouwt de downloadbare JSON-tekst voor het huidige pandprofiel. */
export function buildExportJson(building) {
  const payload = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    building,
  }
  return JSON.stringify(payload, null, 2)
}

export function triggerJsonDownload(building) {
  const json = buildExportJson(building)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safeName = (building.name || 'pand').trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '') || 'pand'
  a.href = url
  a.download = `mjop-${safeName || 'pand'}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const STRING_FIELD = (v) => (typeof v === 'string' ? v : '')
const NUMBER_OR_NULL = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/**
 * Zet willekeurige, mogelijk onvolledige of te vertrouwen invoer om naar een
 * geldig componentobject. Onbekende/ontbrekende velden worden `null`/leeg,
 * nooit verzonnen of overgenomen van elders.
 */
function sanitizeComponent(raw) {
  if (!raw || typeof raw !== 'object') return null
  const empty = createEmptyComponent()
  return {
    id: STRING_FIELD(raw.id) || empty.id,
    typeId: STRING_FIELD(raw.typeId) || null,
    customLabel: STRING_FIELD(raw.customLabel),
    currentSituation: STRING_FIELD(raw.currentSituation),
    installationYear: NUMBER_OR_NULL(raw.installationYear),
    expectedLifetime: NUMBER_OR_NULL(raw.expectedLifetime),
    maintenanceYear: NUMBER_OR_NULL(raw.maintenanceYear),
    replacementYear: NUMBER_OR_NULL(raw.replacementYear),
    notes: STRING_FIELD(raw.notes),
  }
}

const BUILDING_LIKE_KEYS = ['name', 'location', 'constructionYear', 'buildingUse', 'floorArea', 'energy', 'components']

function sanitizeBuilding(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  // Weigert bestanden die geen enkel herkenbaar pandveld bevatten, in plaats
  // van die stilzwijgend om te zetten naar een leeg pand (sectie 22: ongeldige
  // bestanden moeten netjes worden afgewezen, niet stil worden "gered").
  if (!BUILDING_LIKE_KEYS.some((key) => key in raw)) return null
  const empty = createEmptyBuilding()
  const energy = raw.energy && typeof raw.energy === 'object' ? raw.energy : {}
  const components = Array.isArray(raw.components) ? raw.components.map(sanitizeComponent).filter(Boolean) : []

  return {
    ...empty,
    id: STRING_FIELD(raw.id) || empty.id,
    name: STRING_FIELD(raw.name),
    location: STRING_FIELD(raw.location),
    constructionYear: NUMBER_OR_NULL(raw.constructionYear),
    buildingUse: STRING_FIELD(raw.buildingUse) || null,
    floorArea: NUMBER_OR_NULL(raw.floorArea),
    floors: NUMBER_OR_NULL(raw.floors),
    occupants: NUMBER_OR_NULL(raw.occupants),
    notes: STRING_FIELD(raw.notes),
    energy: {
      gasConsumption: NUMBER_OR_NULL(energy.gasConsumption),
      electricityConsumption: NUMBER_OR_NULL(energy.electricityConsumption),
      energySource: STRING_FIELD(energy.energySource) || null,
      heatingSystem: STRING_FIELD(energy.heatingSystem) || null,
      energyLabel: STRING_FIELD(energy.energyLabel) || null,
    },
    components,
    createdAt: STRING_FIELD(raw.createdAt) || empty.createdAt,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Parseert en valideert een geïmporteerd JSON-bestand. Gebruikt uitsluitend
 * `JSON.parse` (nooit `eval`/`Function`), en bouwt daarna een schoon
 * pandprofiel op uit alleen de verwachte velden — een bestand kan dus nooit
 * willekeurige code of onverwachte velden injecteren. Geeft altijd een
 * bruikbaar resultaat terug, met een duidelijke foutmelding bij ongeldige
 * bestanden in plaats van een crash.
 */
export function parseImportedJson(rawText) {
  let data
  try {
    data = JSON.parse(rawText)
  } catch {
    return { ok: false, error: 'Dit bestand is geen geldig JSON-bestand.' }
  }

  const payload = data && typeof data === 'object' && data.building ? data : { building: data }
  const building = sanitizeBuilding(payload.building)

  if (!building) {
    return { ok: false, error: 'Dit bestand bevat geen geldig pandprofiel.' }
  }

  return { ok: true, building }
}
