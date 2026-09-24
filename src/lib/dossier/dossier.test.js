import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createKlant, createContactpersoon, addContactpersoon } from './klant.js'
import { createPand, updatePand } from './pand.js'
import {
  DOSSIER_STATUS,
  createDossier,
  isDossierOpen,
  refreshDossierSnapshot,
  completeDossier,
} from './dossier.js'

function fictiefPand() {
  return createPand({
    bouwjaar: 1987,
    gebruikstype: 'kantoor',
    vloeroppervlak: 500,
    bouwlagen: 2,
    energiebron: 'gas',
  })
}

test('Dossier krijgt een unieke ID', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  const a = createDossier({ klant, pand })
  const b = createDossier({ klant, pand })
  assert.ok(a.dossierId)
  assert.notEqual(a.dossierId, b.dossierId)
})

test('Dossier verwijst naar de juiste klantId en pandId', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand })
  assert.equal(dossier.klantId, klant.klantId)
  assert.equal(dossier.pandId, pand.pandId)
})

test('createDossier valideert dat Klant en Pand een ID hebben', () => {
  const pand = fictiefPand()
  assert.throws(() => createDossier({ klant: {}, pand }))
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  assert.throws(() => createDossier({ klant, pand: {} }))
})

test('Dossier krijgt bij aanmaken een snapshot van de relevante Pandgegevens', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand })

  assert.equal(dossier.pandSnapshot.bouwjaar, 1987)
  assert.equal(dossier.pandSnapshot.gebruikstype, 'kantoor')
  assert.equal(dossier.pandSnapshot.vloeroppervlak, 500)
  assert.equal(dossier.pandSnapshot.bouwlagen, 2)
  assert.equal(dossier.pandSnapshot.energiebron, 'gas')
  // identiteit/locatie/metadata horen niet in de snapshot (hoofdstuk 11)
  assert.equal('pandId' in dossier.pandSnapshot, false)
  assert.equal('adres' in dossier.pandSnapshot, false)
})

test('snapshotregel: het Pand wijzigen verandert het Dossier-snapshot NIET', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  let pand = fictiefPand()
  const dossier = createDossier({ klant, pand })

  // Later: het Pand wordt gecorrigeerd.
  pand = updatePand(pand, { bouwjaar: 1986, gebruikstype: 'bedrijfsruimte' })

  assert.equal(pand.bouwjaar, 1986)
  assert.equal(pand.gebruikstype, 'bedrijfsruimte')
  assert.equal(dossier.pandSnapshot.bouwjaar, 1987)
  assert.equal(dossier.pandSnapshot.gebruikstype, 'kantoor')

  // de snapshot is bevroren: een directe wijzigingspoging faalt
  assert.throws(() => {
    dossier.pandSnapshot.bouwjaar = 2099
  })
})

test('een open Dossier kan worden aangepast (snapshot verversen)', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  let pand = fictiefPand()
  const dossier = createDossier({ klant, pand })

  pand = updatePand(pand, { bouwjaar: 1986 })
  const bijgewerkt = refreshDossierSnapshot(dossier, pand)

  assert.equal(isDossierOpen(bijgewerkt), true)
  assert.equal(bijgewerkt.pandSnapshot.bouwjaar, 1986)
  // het origineel blijft ongewijzigd (immutable update)
  assert.equal(dossier.pandSnapshot.bouwjaar, 1987)
})

test('Dossier kan van open naar afgerond', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand })

  assert.equal(dossier.status, DOSSIER_STATUS.OPEN)
  const afgerond = completeDossier(dossier)
  assert.equal(afgerond.status, DOSSIER_STATUS.AFGEROND)
})

test('een afgerond Dossier blijft reproduceerbaar', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  let pand = fictiefPand()
  const dossier = createDossier({ klant, pand })
  const afgerond = completeDossier(dossier)

  // de snapshot kan niet meer worden ververst
  pand = updatePand(pand, { bouwjaar: 1986 })
  assert.throws(() => refreshDossierSnapshot(afgerond, pand))

  // het afgeronde Dossier zelf is bevroren: geen enkel veld kan nog wijzigen
  assert.throws(() => {
    afgerond.status = DOSSIER_STATUS.OPEN
  })
  assert.equal(afgerond.pandSnapshot.bouwjaar, 1987)

  // opnieuw afronden is veilig (idempotent) en levert dezelfde inhoud op
  const nogmaals = completeDossier(afgerond)
  assert.equal(nogmaals, afgerond)
})

test('meerdere Panden kunnen aan dezelfde Klant worden gekoppeld via afzonderlijke Dossiers', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pandA = createPand({ omschrijving: 'Pand A', bouwjaar: 1990 })
  const pandB = createPand({ omschrijving: 'Pand B', bouwjaar: 2005 })

  const dossierA = createDossier({ klant, pand: pandA })
  const dossierB = createDossier({ klant, pand: pandB })

  assert.equal(dossierA.klantId, klant.klantId)
  assert.equal(dossierB.klantId, klant.klantId)
  assert.notEqual(dossierA.pandId, dossierB.pandId)
  assert.notEqual(dossierA.dossierId, dossierB.dossierId)
})

test('een Dossier kan één primaire Contactpersoon aanwijzen, mits die bij de Klant hoort', () => {
  let klant = createKlant({ naam: 'Fictief Bedrijf' })
  const eigenaar = createContactpersoon({ naam: 'Eigenaar', rol: 'eigenaar' })
  klant = addContactpersoon(klant, eigenaar)
  const pand = fictiefPand()

  const dossier = createDossier({ klant, pand, primaireContactpersoonId: eigenaar.contactpersoonId })
  assert.equal(dossier.primaireContactpersoonId, eigenaar.contactpersoonId)

  assert.throws(() => createDossier({ klant, pand, primaireContactpersoonId: 'niet-bestaand' }))
})
