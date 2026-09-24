import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createKlant, createContactpersoon, addContactpersoon } from './klant.js'
import { createPand } from './pand.js'
import { completeDossier } from './dossier.js'
import { saveKlant, savePand, saveDossier, loadAllDossiers } from './storage.js'
import { saveMjopSnapshotToPand } from './mjopKoppeling.js'
import { openAdviesdossier, vindOpenDossier } from './openDossier.js'

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

function mjopBuildingA(overrides = {}) {
  return {
    id: 'mjop-building-a',
    name: 'Testpand A',
    location: 'Oud-Beijerland',
    constructionYear: 1987,
    buildingUse: 'bedrijfshal',
    floorArea: 650,
    floors: 1,
    occupants: null,
    notes: '',
    energy: { gasConsumption: 18000, electricityConsumption: 32000, energySource: 'gas', heatingSystem: 'cv_ketel', energyLabel: 'F' },
    components: [{ id: 'dak', typeId: 'dak', present: 'ja', customLabel: '', currentSituation: '', installationYear: 1987, expectedLifetime: null, maintenanceYear: null, replacementYear: null, notes: '' }],
    contact: { naam: '', email: '', telefoon: '' },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

test('een nieuw Dossier wordt geopend met de juiste klantId, pandId en primaire Contactpersoon', () => {
  const eigenaar = createContactpersoon({ naam: 'Eigenaar', rol: 'eigenaar' })
  const klant = addContactpersoon(createKlant({ naam: 'Fictief Bedrijf' }), eigenaar)
  const pand = createPand({ omschrijving: 'Testpand', bouwjaar: 1990 })
  saveKlant(klant)
  savePand(pand)

  const { dossier, hergebruikt } = openAdviesdossier({ klant, pand, primaireContactpersoonId: eigenaar.contactpersoonId })

  assert.equal(hergebruikt, false)
  assert.equal(dossier.klantId, klant.klantId)
  assert.equal(dossier.pandId, pand.pandId)
  assert.equal(dossier.primaireContactpersoonId, eigenaar.contactpersoonId)
  assert.equal(dossier.status, 'open')
})

test('pandSnapshot en contactpersoonSnapshot zijn correct gevuld bij het openen', () => {
  const eigenaar = createContactpersoon({ naam: 'Eigenaar', email: 'eigenaar@smvadvies-test.nl', rol: 'eigenaar' })
  const klant = addContactpersoon(createKlant({ naam: 'Fictief Bedrijf' }), eigenaar)
  const pand = createPand({ bouwjaar: 1990, gebruikstype: 'kantoor' })

  const { dossier } = openAdviesdossier({ klant, pand, primaireContactpersoonId: eigenaar.contactpersoonId })

  assert.equal(dossier.pandSnapshot.bouwjaar, 1990)
  assert.equal(dossier.pandSnapshot.gebruikstype, 'kantoor')
  assert.equal(dossier.contactpersoonSnapshot.naam, 'Eigenaar')
  assert.equal(dossier.contactpersoonSnapshot.email, 'eigenaar@smvadvies-test.nl')
})

test('een bestaande MJOP-momentopname wordt automatisch meegenomen bij het openen', () => {
  const { pand, mjopSnapshot } = saveMjopSnapshotToPand(mjopBuildingA())
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  saveKlant(klant)

  const { dossier } = openAdviesdossier({ klant, pand })

  assert.deepEqual(dossier.mjopSnapshot, mjopSnapshot)
})

test('een Dossier kan worden geopend zonder MJOP-momentopname — MJOP is niet verplicht', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = createPand({ omschrijving: 'Nooit via MJOP opgeslagen pand' })

  const { dossier } = openAdviesdossier({ klant, pand })

  assert.equal(dossier.mjopSnapshot, null)
  assert.equal(dossier.status, 'open')
})

test('een tweede poging om te openen voor dezelfde Klant + Pand hergebruikt het bestaande open Dossier', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = createPand({ omschrijving: 'Testpand' })

  const eerste = openAdviesdossier({ klant, pand })
  const tweede = openAdviesdossier({ klant, pand })

  assert.equal(eerste.hergebruikt, false)
  assert.equal(tweede.hergebruikt, true)
  assert.equal(eerste.dossier.dossierId, tweede.dossier.dossierId)
  assert.equal(loadAllDossiers().length, 1)
})

test('vindOpenDossier geeft null terug als er geen open Dossier is', () => {
  assert.equal(vindOpenDossier('onbestaand-klant', 'onbestaand-pand'), null)
})

test('na afronden van het Dossier opent een volgende poging een nieuw Dossier, het oude blijft onveranderd', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = createPand({ omschrijving: 'Testpand', bouwjaar: 1990 })

  const { dossier: eersteDossier } = openAdviesdossier({ klant, pand })
  const afgerond = completeDossier(eersteDossier)
  // In de echte flow wordt het afgeronde Dossier apart opgeslagen door de
  // UI-actie "Dossier afronden" (buiten scope van deze opdracht) — hier
  // simuleren we dat door het rechtstreeks te vervangen in de storage-laag.
  saveDossier(afgerond)

  const { dossier: nieuweDossier, hergebruikt } = openAdviesdossier({ klant, pand })

  assert.equal(hergebruikt, false)
  assert.notEqual(nieuweDossier.dossierId, afgerond.dossierId)
  assert.equal(loadAllDossiers().length, 2)
  const nogSteedsAfgerond = loadAllDossiers().find((d) => d.dossierId === afgerond.dossierId)
  assert.equal(nogSteedsAfgerond.status, 'afgerond')
  assert.equal(nogSteedsAfgerond.pandSnapshot.bouwjaar, 1990)
})
