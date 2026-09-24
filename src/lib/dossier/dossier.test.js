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

test('Dossier krijgt bij aanmaken een contactpersoonSnapshot van de primaire Contactpersoon', () => {
  const eigenaar = createContactpersoon({ naam: 'Eigenaar', email: 'eigenaar@smvadvies-test.nl', telefoon: '0612345678', rol: 'eigenaar' })
  const klant = addContactpersoon(createKlant({ naam: 'Fictief Bedrijf' }), eigenaar)
  const pand = fictiefPand()

  const dossier = createDossier({ klant, pand, primaireContactpersoonId: eigenaar.contactpersoonId })

  assert.deepEqual(dossier.contactpersoonSnapshot, {
    naam: 'Eigenaar',
    email: 'eigenaar@smvadvies-test.nl',
    telefoon: '0612345678',
    rol: 'eigenaar',
  })
  // geen contactpersoonId in de snapshot — dat blijft de verwijzing, niet de inhoud
  assert.equal('contactpersoonId' in dossier.contactpersoonSnapshot, false)
})

test('contactpersoonSnapshot is null zonder primaire Contactpersoon', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand })
  assert.equal(dossier.contactpersoonSnapshot, null)
})

test('contactpersoonSnapshot is onafhankelijk van het actuele Contactpersoon-object', () => {
  const eigenaar = createContactpersoon({ naam: 'Eigenaar', email: 'oud@smvadvies-test.nl', telefoon: '0600000000', rol: 'eigenaar' })
  const klant = addContactpersoon(createKlant({ naam: 'Fictief Bedrijf' }), eigenaar)
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand, primaireContactpersoonId: eigenaar.contactpersoonId })

  // Een latere wijziging aan het oorspronkelijke contactpersoon-object
  // (bijv. via een toekomstige updateContactpersoon()) mag de al bevroren
  // snapshot niet raken.
  eigenaar.email = 'nieuw@smvadvies-test.nl'

  assert.equal(dossier.contactpersoonSnapshot.email, 'oud@smvadvies-test.nl')
  assert.throws(() => {
    dossier.contactpersoonSnapshot.email = 'geforceerd@smvadvies-test.nl'
  })
})

test('een open Dossier kan de contactpersoonSnapshot bewust verversen: correctie van dezelfde contactpersoon', () => {
  const eigenaar = createContactpersoon({ naam: 'Eigenaar', email: 'oud@smvadvies-test.nl', telefoon: '0600000000', rol: 'eigenaar' })
  let klant = addContactpersoon(createKlant({ naam: 'Fictief Bedrijf' }), eigenaar)
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand, primaireContactpersoonId: eigenaar.contactpersoonId })

  // Gecorrigeerde contactgegevens, zelfde contactpersoonId.
  klant = {
    ...klant,
    contactpersonen: klant.contactpersonen.map((c) =>
      c.contactpersoonId === eigenaar.contactpersoonId ? { ...c, telefoon: '0699999999' } : c,
    ),
  }

  const bijgewerkt = refreshDossierSnapshot(dossier, pand, klant)

  assert.equal(bijgewerkt.primaireContactpersoonId, eigenaar.contactpersoonId)
  assert.equal(bijgewerkt.contactpersoonSnapshot.telefoon, '0699999999')
  // het origineel blijft ongewijzigd (immutable update)
  assert.equal(dossier.contactpersoonSnapshot.telefoon, '0600000000')
})

test('een open Dossier kan de primaire Contactpersoon zelf wisselen', () => {
  const eigenaar = createContactpersoon({ naam: 'Eigenaar', rol: 'eigenaar' })
  const facilitair = createContactpersoon({ naam: 'Facilitair', rol: 'facilitair' })
  let klant = createKlant({ naam: 'Fictief Bedrijf' })
  klant = addContactpersoon(klant, eigenaar)
  klant = addContactpersoon(klant, facilitair)
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand, primaireContactpersoonId: eigenaar.contactpersoonId })

  const bijgewerkt = refreshDossierSnapshot(dossier, pand, klant, facilitair.contactpersoonId)

  assert.equal(bijgewerkt.primaireContactpersoonId, facilitair.contactpersoonId)
  assert.equal(bijgewerkt.contactpersoonSnapshot.naam, 'Facilitair')
  // het origineel blijft bij de eigenaar
  assert.equal(dossier.primaireContactpersoonId, eigenaar.contactpersoonId)
  assert.equal(dossier.contactpersoonSnapshot.naam, 'Eigenaar')
})

test('refreshDossierSnapshot zonder klant laat de contactpersoonSnapshot ongewijzigd (bestaand gedrag)', () => {
  const eigenaar = createContactpersoon({ naam: 'Eigenaar', rol: 'eigenaar' })
  const klant = addContactpersoon(createKlant({ naam: 'Fictief Bedrijf' }), eigenaar)
  let pand = fictiefPand()
  const dossier = createDossier({ klant, pand, primaireContactpersoonId: eigenaar.contactpersoonId })

  pand = updatePand(pand, { bouwjaar: 1986 })
  const bijgewerkt = refreshDossierSnapshot(dossier, pand)

  assert.equal(bijgewerkt.pandSnapshot.bouwjaar, 1986)
  assert.equal(bijgewerkt.primaireContactpersoonId, eigenaar.contactpersoonId)
  assert.deepEqual(bijgewerkt.contactpersoonSnapshot, dossier.contactpersoonSnapshot)
})

test('Dossier neemt een meegegeven mjopSnapshot over bij aanmaken', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  const mjopSnapshot = { components: [{ typeId: 'dak', present: 'ja' }], energy: { gasConsumption: 18000, electricityConsumption: 32000 } }

  const dossier = createDossier({ klant, pand, mjopSnapshot })
  assert.deepEqual(dossier.mjopSnapshot, mjopSnapshot)
})

test('Dossier heeft mjopSnapshot: null zonder MJOP-invoer — een Dossier mag zonder MJOP bestaan', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand })
  assert.equal(dossier.mjopSnapshot, null)
})

test('refreshDossierSnapshot ververst mjopSnapshot alleen als expliciet meegegeven', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand, mjopSnapshot: { components: [], energy: {} } })

  // Zonder mjopSnapshot-argument: blijft ongewijzigd, ook als pand/klant/id wel worden meegegeven.
  const zonderWijziging = refreshDossierSnapshot(dossier, pand)
  assert.deepEqual(zonderWijziging.mjopSnapshot, dossier.mjopSnapshot)

  const nieuweSnapshot = { components: [{ typeId: 'verwarming' }], energy: { gasConsumption: 5000 } }
  const metWijziging = refreshDossierSnapshot(dossier, pand, null, dossier.primaireContactpersoonId, nieuweSnapshot)
  assert.deepEqual(metWijziging.mjopSnapshot, nieuweSnapshot)
  // het origineel blijft ongewijzigd
  assert.deepEqual(dossier.mjopSnapshot, { components: [], energy: {} })
})

test('een afgerond Dossier blijft historisch stabiel: contactpersoonSnapshot kan niet meer worden ververst', () => {
  const eigenaar = createContactpersoon({ naam: 'Eigenaar', email: 'oud@smvadvies-test.nl', rol: 'eigenaar' })
  const klant = addContactpersoon(createKlant({ naam: 'Fictief Bedrijf' }), eigenaar)
  const pand = fictiefPand()
  const dossier = createDossier({ klant, pand, primaireContactpersoonId: eigenaar.contactpersoonId })
  const afgerond = completeDossier(dossier)

  const gecorrigeerdeKlant = {
    ...klant,
    contactpersonen: klant.contactpersonen.map((c) => ({ ...c, email: 'nieuw@smvadvies-test.nl' })),
  }

  assert.throws(() => refreshDossierSnapshot(afgerond, pand, gecorrigeerdeKlant))
  assert.equal(afgerond.contactpersoonSnapshot.email, 'oud@smvadvies-test.nl')
  assert.throws(() => {
    afgerond.contactpersoonSnapshot.email = 'geforceerd@smvadvies-test.nl'
  })
})
