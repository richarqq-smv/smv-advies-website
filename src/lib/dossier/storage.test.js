import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createKlant, createContactpersoon, addContactpersoon } from './klant.js'
import { createPand, updatePand } from './pand.js'
import { createDossier, completeDossier, DOSSIER_STATUS } from './dossier.js'
import {
  saveKlant,
  loadKlant,
  loadAllKlanten,
  deleteKlant,
  savePand,
  loadPand,
  loadAllPanden,
  deletePand,
  saveDossier,
  loadDossier,
  loadAllDossiers,
  deleteDossier,
} from './storage.js'

// Minimale, dependency-vrije vervanger voor localStorage — alleen om deze
// module onder de kale Node-testrunner te kunnen draaien (geen browser,
// geen jsdom). storage.js gebruikt bewust `globalThis.localStorage`, zie
// het commentaar daar.
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

function fictiefPand(overrides = {}) {
  return createPand({ bouwjaar: 1987, gebruikstype: 'kantoor', vloeroppervlak: 500, bouwlagen: 2, energiebron: 'gas', ...overrides })
}

test('Klant opslaan en teruglezen', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf', email: 'smvadvies@gmail.com' })
  assert.equal(saveKlant(klant), true)
  const geladen = loadKlant(klant.klantId)
  assert.deepEqual(geladen, klant)
})

test('Pand opslaan en teruglezen', () => {
  const pand = fictiefPand()
  assert.equal(savePand(pand), true)
  const geladen = loadPand(pand.pandId)
  assert.deepEqual(geladen, pand)
})

test('Dossier opslaan en teruglezen', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand })
  assert.equal(saveDossier(dossier), true)
  const geladen = loadDossier(dossier.dossierId)
  assert.equal(geladen.dossierId, dossier.dossierId)
  assert.equal(geladen.klantId, klant.klantId)
  assert.equal(geladen.pandId, pand.pandId)
  assert.deepEqual(geladen.pandSnapshot, dossier.pandSnapshot)
})

test('meerdere Panden bij één Klant worden allebei correct opgeslagen', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pandA = fictiefPand({ omschrijving: 'Pand A' })
  const pandB = fictiefPand({ omschrijving: 'Pand B' })
  const dossierA = createDossier({ klant, pand: pandA })
  const dossierB = createDossier({ klant, pand: pandB })

  saveKlant(klant)
  savePand(pandA)
  savePand(pandB)
  saveDossier(dossierA)
  saveDossier(dossierB)

  const panden = loadAllPanden()
  assert.equal(panden.length, 2)
  const dossiers = loadAllDossiers().filter((d) => d.klantId === klant.klantId)
  assert.equal(dossiers.length, 2)
  assert.notEqual(dossiers[0].pandId, dossiers[1].pandId)
})

test('meerdere Contactpersonen bij één Klant blijven na roundtrip intact', () => {
  let klant = createKlant({ naam: 'Fictief Bedrijf' })
  const eigenaar = createContactpersoon({ naam: 'Eigenaar', rol: 'eigenaar' })
  const facilitair = createContactpersoon({ naam: 'Facilitair', rol: 'facilitair' })
  klant = addContactpersoon(klant, eigenaar)
  klant = addContactpersoon(klant, facilitair)

  saveKlant(klant)
  const geladen = loadKlant(klant.klantId)

  assert.equal(geladen.contactpersonen.length, 2)
  assert.deepEqual(
    geladen.contactpersonen.map((c) => c.contactpersoonId).sort(),
    [eigenaar.contactpersoonId, facilitair.contactpersoonId].sort(),
  )
})

test('Dossier met primaire Contactpersoon blijft na roundtrip behouden', () => {
  let klant = createKlant({ naam: 'Fictief Bedrijf' })
  const eigenaar = createContactpersoon({ naam: 'Eigenaar', rol: 'eigenaar' })
  klant = addContactpersoon(klant, eigenaar)
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand, primaireContactpersoonId: eigenaar.contactpersoonId })

  saveDossier(dossier)
  const geladen = loadDossier(dossier.dossierId)
  assert.equal(geladen.primaireContactpersoonId, eigenaar.contactpersoonId)
})

test('open Dossier roundtrip: status blijft open en het object blijft muteerbaar', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand })

  saveDossier(dossier)
  const geladen = loadDossier(dossier.dossierId)

  assert.equal(geladen.status, DOSSIER_STATUS.OPEN)
  assert.equal(Object.isFrozen(geladen), false)
  // de snapshot zelf blijft wel altijd bevroren, ook in een open Dossier
  assert.equal(Object.isFrozen(geladen.pandSnapshot), true)
})

test('afgerond Dossier roundtrip: status blijft afgerond en het object is opnieuw bevroren', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  const afgerond = completeDossier(createDossier({ klant, pand }))

  saveDossier(afgerond)
  const geladen = loadDossier(afgerond.dossierId)

  assert.equal(geladen.status, DOSSIER_STATUS.AFGEROND)
  assert.equal(Object.isFrozen(geladen), true)
  assert.equal(Object.isFrozen(geladen.pandSnapshot), true)
})

test('snapshotregel via storage: een later gewijzigd en opgeslagen Pand verandert het opgeslagen Dossier-snapshot niet', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  let pand = fictiefPand()
  const dossier = createDossier({ klant, pand })
  saveDossier(dossier)

  // Later: het Pand wordt gecorrigeerd en apart opgeslagen.
  pand = updatePand(pand, { bouwjaar: 1986, gebruikstype: 'bedrijfsruimte' })
  savePand(pand)

  const geladenPand = loadPand(pand.pandId)
  const geladenDossier = loadDossier(dossier.dossierId)

  assert.equal(geladenPand.bouwjaar, 1986)
  assert.equal(geladenDossier.pandSnapshot.bouwjaar, 1987)
  assert.equal(geladenDossier.pandSnapshot.gebruikstype, 'kantoor')
})

test('een afgerond Dossier blijft na localStorage-roundtrip reproduceerbaar, ook na een latere Pand-wijziging', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  let pand = fictiefPand()
  const afgerond = completeDossier(createDossier({ klant, pand }))
  saveDossier(afgerond)

  pand = updatePand(pand, { bouwjaar: 1986 })
  savePand(pand)

  const geladen = loadDossier(afgerond.dossierId)
  assert.equal(geladen.pandSnapshot.bouwjaar, 1987)
  assert.throws(() => {
    geladen.status = DOSSIER_STATUS.OPEN
  })
  assert.throws(() => {
    geladen.pandSnapshot.bouwjaar = 2099
  })
})

test('verwijderen van een record (Klant, Pand en Dossier)', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand })
  saveKlant(klant)
  savePand(pand)
  saveDossier(dossier)

  assert.equal(deleteKlant(klant.klantId), true)
  assert.equal(loadKlant(klant.klantId), null)
  assert.equal(deletePand(pand.pandId), true)
  assert.equal(loadPand(pand.pandId), null)
  assert.equal(deleteDossier(dossier.dossierId), true)
  assert.equal(loadDossier(dossier.dossierId), null)

  // nogmaals verwijderen levert geen fout op, alleen `false`
  assert.equal(deleteKlant(klant.klantId), false)
})

test('geen collision met de bestaande MJOP-opslagsleutel', () => {
  const mjopKey = 'smv_mjop_building_v1'
  const mjopWaarde = JSON.stringify({ id: 'mjop-fictief', schemaVersion: 1 })
  globalThis.localStorage.setItem(mjopKey, mjopWaarde)

  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand })
  saveKlant(klant)
  savePand(pand)
  saveDossier(dossier)
  deleteKlant(klant.klantId)

  // de MJOP-sleutel is volledig ongemoeid gebleven
  assert.equal(globalThis.localStorage.getItem(mjopKey), mjopWaarde)
})

test('lege of ontbrekende storage-data veroorzaakt geen crash', () => {
  assert.equal(loadKlant('onbestaand'), null)
  assert.equal(loadPand('onbestaand'), null)
  assert.equal(loadDossier('onbestaand'), null)
  assert.deepEqual(loadAllKlanten(), [])
  assert.deepEqual(loadAllPanden(), [])
  assert.deepEqual(loadAllDossiers(), [])
})

test('ongeldige JSON veroorzaakt geen crash en wordt niet blind vertrouwd', () => {
  globalThis.localStorage.setItem('smv_dossier_klanten_v1', '{niet geldige json')
  assert.deepEqual(loadAllKlanten(), [])
  assert.equal(loadKlant('iets'), null)
})

test('geldige JSON met een verkeerde vorm wordt afgewezen, niet stilzwijgend geaccepteerd', () => {
  // een array in plaats van een { [id]: record }-object
  globalThis.localStorage.setItem('smv_dossier_panden_v1', JSON.stringify([{ pandId: 'x' }]))
  assert.deepEqual(loadAllPanden(), [])

  // een record zonder de verplichte identiteit
  globalThis.localStorage.setItem('smv_dossier_panden_v1', JSON.stringify({ x: { omschrijving: 'geen pandId' } }))
  assert.equal(loadPand('x'), null)
  assert.deepEqual(loadAllPanden(), [])
})

test('saveKlant/savePand/saveDossier wijzen duidelijk ongeldige objecten af', () => {
  assert.throws(() => saveKlant({ naam: 'geen klantId' }))
  assert.throws(() => savePand({ omschrijving: 'geen pandId' }))
  assert.throws(() => saveDossier({ status: 'open' }))
})
