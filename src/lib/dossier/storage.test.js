import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createKlant, createContactpersoon, addContactpersoon } from './klant.js'
import { createPand, updatePand } from './pand.js'
import { createDossier, completeDossier, addAdviespunt, DOSSIER_STATUS } from './dossier.js'
import { createAdviespunt } from './adviespunt.js'
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

test('Dossier met contactpersoonSnapshot wordt opgeslagen en opnieuw geladen', () => {
  let klant = createKlant({ naam: 'Fictief Bedrijf' })
  const eigenaar = createContactpersoon({ naam: 'Eigenaar', email: 'eigenaar@smvadvies-test.nl', telefoon: '0612345678', rol: 'eigenaar' })
  klant = addContactpersoon(klant, eigenaar)
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand, primaireContactpersoonId: eigenaar.contactpersoonId })

  saveDossier(dossier)
  const geladen = loadDossier(dossier.dossierId)

  assert.deepEqual(geladen.contactpersoonSnapshot, {
    naam: 'Eigenaar',
    email: 'eigenaar@smvadvies-test.nl',
    telefoon: '0612345678',
    rol: 'eigenaar',
  })
})

test('contactpersoonSnapshot en pandSnapshot zijn na rehydration allebei opnieuw bevroren', () => {
  let klant = createKlant({ naam: 'Fictief Bedrijf' })
  const eigenaar = createContactpersoon({ naam: 'Eigenaar', rol: 'eigenaar' })
  klant = addContactpersoon(klant, eigenaar)
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand, primaireContactpersoonId: eigenaar.contactpersoonId })

  saveDossier(dossier)
  const geladen = loadDossier(dossier.dossierId)

  assert.equal(Object.isFrozen(geladen.pandSnapshot), true)
  assert.equal(Object.isFrozen(geladen.contactpersoonSnapshot), true)

  // een mutatiepoging op de gerehydrateerde snapshot verandert de data niet
  assert.throws(() => {
    geladen.contactpersoonSnapshot.naam = 'Geforceerd'
  })
  assert.equal(geladen.contactpersoonSnapshot.naam, 'Eigenaar')
})

test('een afgerond Dossier blijft na save/load historisch identiek, inclusief contactpersoonSnapshot', () => {
  let klant = createKlant({ naam: 'Fictief Bedrijf' })
  const eigenaar = createContactpersoon({ naam: 'Eigenaar', email: 'oud@smvadvies-test.nl', rol: 'eigenaar' })
  klant = addContactpersoon(klant, eigenaar)
  const pand = fictiefPand()
  const afgerond = completeDossier(createDossier({ klant, pand, primaireContactpersoonId: eigenaar.contactpersoonId }))

  saveDossier(afgerond)
  const geladen = loadDossier(afgerond.dossierId)

  assert.equal(geladen.status, DOSSIER_STATUS.AFGEROND)
  assert.equal(Object.isFrozen(geladen), true)
  assert.equal(Object.isFrozen(geladen.contactpersoonSnapshot), true)
  assert.equal(geladen.contactpersoonSnapshot.email, 'oud@smvadvies-test.nl')
  assert.throws(() => {
    geladen.contactpersoonSnapshot = null
  })
})

test('een Dossier met contactpersoonSnapshot: null blijft geldig na save/load', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand })

  assert.equal(dossier.contactpersoonSnapshot, null)
  saveDossier(dossier)
  const geladen = loadDossier(dossier.dossierId)
  assert.equal(geladen.contactpersoonSnapshot, null)
})

test('een ouder opgeslagen Dossier zonder contactpersoonSnapshot-veld blijft compatibel', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand })

  // Simuleert een Dossier zoals opgeslagen vóór 0335fbe: geen
  // contactpersoonSnapshot-property aanwezig, niet eens als null.
  const { contactpersoonSnapshot: _contactpersoonSnapshot, ...ouderDossier } = dossier
  globalThis.localStorage.setItem('smv_dossier_dossiers_v1', JSON.stringify({ [dossier.dossierId]: ouderDossier }))

  const geladen = loadDossier(dossier.dossierId)
  assert.ok(geladen)
  assert.equal(geladen.contactpersoonSnapshot, null)
  assert.equal(geladen.dossierId, dossier.dossierId)
})

test('mjopSnapshot wordt na rehydratie opnieuw diep bevroren, inclusief geneste components', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  const mjopSnapshot = { components: [{ typeId: 'dak', present: 'ja', installationYear: 1987 }], energy: { gasConsumption: 18000 } }
  const dossier = createDossier({ klant, pand, mjopSnapshot })

  saveDossier(dossier)
  const geladen = loadDossier(dossier.dossierId)

  assert.deepEqual(geladen.mjopSnapshot, mjopSnapshot)
  assert.equal(Object.isFrozen(geladen.mjopSnapshot), true)
  assert.equal(Object.isFrozen(geladen.mjopSnapshot.components), true)
  assert.equal(Object.isFrozen(geladen.mjopSnapshot.components[0]), true)
  assert.throws(() => {
    geladen.mjopSnapshot.components[0].installationYear = 2099
  })
})

test('een ouder Dossier zonder mjopSnapshot-veld blijft compatibel (mjopSnapshot: null)', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand })
  const { mjopSnapshot: _mjopSnapshot, ...ouderDossier } = dossier
  globalThis.localStorage.setItem('smv_dossier_dossiers_v1', JSON.stringify({ [dossier.dossierId]: ouderDossier }))

  const geladen = loadDossier(dossier.dossierId)
  assert.ok(geladen)
  assert.equal(geladen.mjopSnapshot, null)
})

test('rehydratie leidt de contactpersoonSnapshot nooit af van de actuele Contactpersoon', () => {
  let klant = createKlant({ naam: 'Fictief Bedrijf' })
  const eigenaar = createContactpersoon({ naam: 'Eigenaar', email: 'oud@smvadvies-test.nl', rol: 'eigenaar' })
  klant = addContactpersoon(klant, eigenaar)
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand, primaireContactpersoonId: eigenaar.contactpersoonId })
  saveKlant(klant)
  saveDossier(dossier)

  // De levende Klant/Contactpersoon wordt daarna gecorrigeerd en opnieuw
  // opgeslagen — de al opgeslagen Dossier-snapshot mag dit niet oppikken,
  // want loadDossier() leest nooit de Klant-opslag om de snapshot opnieuw
  // samen te stellen.
  const gecorrigeerdeKlant = {
    ...klant,
    contactpersonen: klant.contactpersonen.map((c) => ({ ...c, email: 'nieuw@smvadvies-test.nl' })),
  }
  saveKlant(gecorrigeerdeKlant)

  const geladenDossier = loadDossier(dossier.dossierId)
  assert.equal(geladenDossier.contactpersoonSnapshot.email, 'oud@smvadvies-test.nl')
})

// --- Advieslaag: adviespunten[] ---------------------------------------------

function handmatigAdviespunt(overrides = {}) {
  return createAdviespunt({
    onderwerp: 'Losse notitie',
    herkomst: 'handmatig',
    adviesStatus: 'later_beoordelen',
    toelichting: 'Kort overleg gehad met de klant.',
    ...overrides,
  })
}

test('een ouder opgeslagen Dossier zonder adviespunten-veld laadt als een lege lijst — B', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand })

  // Simuleert een Dossier zoals opgeslagen vóór de advieslaag: geen
  // adviespunten-property aanwezig, niet eens als lege array.
  const { adviespunten: _adviespunten, ...ouderDossier } = dossier
  globalThis.localStorage.setItem('smv_dossier_dossiers_v1', JSON.stringify({ [dossier.dossierId]: ouderDossier }))

  const geladen = loadDossier(dossier.dossierId)
  assert.ok(geladen)
  assert.deepEqual(geladen.adviespunten, [])
})

test('adviespunten blijven na save/load behouden — S', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  let dossier = createDossier({ klant, pand })
  dossier = addAdviespunt(dossier, handmatigAdviespunt())

  saveDossier(dossier)
  const geladen = loadDossier(dossier.dossierId)

  assert.equal(geladen.adviespunten.length, 1)
  assert.deepEqual(geladen.adviespunten[0], dossier.adviespunten[0])
})

test('adviespunten en hun signaalBevroren worden bij rehydratie opnieuw bevroren — I', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  const signaalBevroren = { componentId: 'component-1', componentLabel: 'Cv / verwarming', status: 'meenemen_bij_vervanging', statusLabel: 'Meenemen bij vervanging', relevantYear: 2027 }
  let dossier = createDossier({ klant, pand })
  dossier = addAdviespunt(
    dossier,
    createAdviespunt({ onderwerp: 'Cv / verwarming', herkomst: 'automatisch', adviesStatus: 'meenemen_bij_vervanging', toelichting: 'Bevestigd.', signaalBevroren }),
  )

  saveDossier(dossier)
  const geladen = loadDossier(dossier.dossierId)

  assert.equal(Object.isFrozen(geladen.adviespunten), true)
  assert.equal(Object.isFrozen(geladen.adviespunten[0]), true)
  assert.equal(Object.isFrozen(geladen.adviespunten[0].signaalBevroren), true)
  assert.throws(() => {
    geladen.adviespunten[0].toelichting = 'geforceerd'
  })
  assert.throws(() => {
    geladen.adviespunten[0].signaalBevroren.status = 'geen_actie_nodig'
  })
})

test('een afgerond Dossier blijft na save/load historisch identiek, inclusief adviespunten', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  let dossier = createDossier({ klant, pand })
  dossier = addAdviespunt(dossier, handmatigAdviespunt())
  const afgerond = completeDossier(dossier)

  saveDossier(afgerond)
  const geladen = loadDossier(afgerond.dossierId)

  assert.equal(geladen.status, DOSSIER_STATUS.AFGEROND)
  assert.equal(Object.isFrozen(geladen), true)
  assert.deepEqual(geladen.adviespunten, afgerond.adviespunten)
  assert.throws(() => {
    geladen.adviespunten.push(handmatigAdviespunt())
  })
})

test('saveDossier wijst een adviespunten-veld af dat geen array is', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand })
  assert.throws(() => saveDossier({ ...dossier, adviespunten: 'niet-een-array' }))
})
