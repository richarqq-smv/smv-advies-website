import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { loadPand, loadAllPanden, loadAllKlanten, loadAllDossiers } from './storage.js'
import { createDossier } from './dossier.js'
import { createKlant } from './klant.js'
import { saveMjopSnapshotToPand } from './mjopKoppeling.js'

// Zelfde minimale in-memory localStorage-vervanger als storage.test.js.
class MemoryStorage {
  constructor() {
    this.store = new Map()
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null
  }
  setItem(key, value) {
    this.store.set(key, String(value))
  }
  removeItem(key) {
    this.store.delete(key)
  }
}

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage()
})

// Overgenomen van buildTestpandA() in lib/mjop/testData.js (zie de
// toelichting in mjopAdapter.test.js over waarom dit hier letterlijk wordt
// herhaald in plaats van geïmporteerd).
function mjopBuildingA(overrides = {}) {
  return {
    id: 'mjop-building-a',
    name: 'Testpand A (oud bedrijfspand)',
    location: 'Oud-Beijerland',
    constructionYear: 1987,
    buildingUse: 'bedrijfshal',
    floorArea: 650,
    floors: 1,
    occupants: null,
    notes: 'Testdata: pand met meerdere verouderde onderdelen.',
    energy: { gasConsumption: 18000, electricityConsumption: 32000, energySource: 'gas', heatingSystem: 'cv_ketel', energyLabel: 'F' },
    components: [
      {
        id: 'verwarming',
        typeId: 'verwarming',
        present: 'ja',
        customLabel: '',
        currentSituation: 'Gasgestookte cv-ketel uit 2006.',
        installationYear: 2006,
        expectedLifetime: 20,
        maintenanceYear: null,
        replacementYear: 2027,
        notes: '',
      },
    ],
    contact: { naam: '', email: '', telefoon: '' },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

test('eerste opslag: MJOP-building resulteert in een nieuw Pand + MJOP-snapshot', () => {
  const building = mjopBuildingA()
  const result = saveMjopSnapshotToPand(building)

  assert.ok(result.pand.pandId)
  assert.equal(result.pand.omschrijving, 'Testpand A (oud bedrijfspand)')
  assert.equal(result.pand.bouwjaar, 1987)
  assert.equal(result.mjopSnapshot.energy.gasConsumption, 18000)

  const opgeslagenPand = loadPand(result.pand.pandId)
  assert.ok(opgeslagenPand)
  assert.equal(opgeslagenPand.pandId, result.pand.pandId)
})

test('tweede opslag voor dezelfde MJOP-building werkt hetzelfde Pand bij, geen tweede Pand', () => {
  const building = mjopBuildingA()
  const eersteResultaat = saveMjopSnapshotToPand(building)

  const gewijzigdeBuilding = mjopBuildingA({ constructionYear: 1986, buildingUse: 'kantoor' })
  const tweedeResultaat = saveMjopSnapshotToPand(gewijzigdeBuilding)

  assert.equal(tweedeResultaat.pand.pandId, eersteResultaat.pand.pandId)
  assert.equal(loadAllPanden().length, 1)
  assert.equal(tweedeResultaat.pand.bouwjaar, 1986)
  assert.equal(tweedeResultaat.pand.gebruikstype, 'kantoor')
})

test('MJOP-gegevens worden bij herhaalde opslag vervangen in de actuele snapshot', () => {
  const building = mjopBuildingA()
  saveMjopSnapshotToPand(building)

  const gewijzigdeBuilding = mjopBuildingA({
    energy: { ...mjopBuildingA().energy, gasConsumption: 9999 },
    components: [{ ...mjopBuildingA().components[0], replacementYear: 2030 }],
  })
  const tweedeResultaat = saveMjopSnapshotToPand(gewijzigdeBuilding)

  assert.equal(tweedeResultaat.mjopSnapshot.energy.gasConsumption, 9999)
  assert.equal(tweedeResultaat.mjopSnapshot.components[0].replacementYear, 2030)
})

test('geen Klant wordt aangemaakt', () => {
  saveMjopSnapshotToPand(mjopBuildingA())
  assert.deepEqual(loadAllKlanten(), [])
})

test('geen Dossier wordt aangemaakt', () => {
  const result = saveMjopSnapshotToPand(mjopBuildingA())
  assert.deepEqual(loadAllDossiers(), [])
  assert.equal('dossierId' in result, false)
  assert.equal('klantId' in result.pand, false)
})

test('createDossier() blijft ongewijzigd en vereist nog steeds een Klant met klantId', () => {
  const pand = saveMjopSnapshotToPand(mjopBuildingA()).pand
  assert.throws(() => createDossier({ klant: {}, pand }))
  const klant = createKlant({ naam: 'Fictieve Klant' })
  const dossier = createDossier({ klant, pand })
  assert.equal(dossier.klantId, klant.klantId)
})

test('een MJOP-reset (het wissen van smv_mjop_building_v1) laat het opgeslagen Pand en de koppeling ongemoeid', () => {
  const building = mjopBuildingA()
  const result = saveMjopSnapshotToPand(building)

  // Simuleert exact wat clearBuilding() in lib/mjop/storage.js doet,
  // zonder dat bestand te importeren (extensieloze MJOP-imports breken
  // onder de kale Node-testrunner, zie mjopAdapter.test.js).
  globalThis.localStorage.removeItem('smv_mjop_building_v1')

  assert.ok(loadPand(result.pand.pandId))
  assert.ok(globalThis.localStorage.getItem('smv_dossier_mjopKoppeling_v1'))
})

test('een fout bij het opslaan van de koppeling laat de MJOP-invoer (het building-object) intact', () => {
  const building = mjopBuildingA()
  const kopieVoorAanroep = structuredClone(building)

  const echteSetItem = globalThis.localStorage.setItem.bind(globalThis.localStorage)
  globalThis.localStorage.setItem = (key, value) => {
    // Alleen de koppeling-write mislukt (bijv. net over de quota op dat
    // specifieke record); het Pand opslaan en het rollback-verwijderen
    // van het Pand gebruiken beide een andere sleutel en blijven werken.
    if (key === 'smv_dossier_mjopKoppeling_v1') throw new Error('quota exceeded (gesimuleerd)')
    return echteSetItem(key, value)
  }

  assert.throws(() => saveMjopSnapshotToPand(building))
  assert.deepEqual(building, kopieVoorAanroep)

  // rollback: het in deze aanroep nieuw aangemaakte Pand is weer verwijderd
  assert.equal(loadAllPanden().length, 0)
})

test('bestaande MJOP-storage (smv_mjop_building_v1) blijft volledig buiten beeld', () => {
  const mjopWaarde = JSON.stringify({ id: 'mjop-building-a', schemaVersion: 1 })
  globalThis.localStorage.setItem('smv_mjop_building_v1', mjopWaarde)

  saveMjopSnapshotToPand(mjopBuildingA())

  assert.equal(globalThis.localStorage.getItem('smv_mjop_building_v1'), mjopWaarde)
})
