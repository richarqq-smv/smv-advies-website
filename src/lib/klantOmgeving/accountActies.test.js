import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bouwAccountActies } from './accountActies.js'

const VOLLEDIGE_KLANT = { naam: 'Jan', bedrijfsnaam: 'Jansen BV' }
const VOLLEDIG_CONTACT = { naam: 'Jan', email: 'jan@jansenbv.test' }
const VOLLEDIG_PAND = { omschrijving: 'Pand A', adres: 'Kerkstraat 1', postcode: '1234AB', plaats: 'Rotterdam', gebruikstype: 'kantoor' }

test('bouwAccountActies: alles compleet geeft een lege lijst', () => {
  const acties = bouwAccountActies({
    klant: VOLLEDIGE_KLANT,
    contactpersoon: VOLLEDIG_CONTACT,
    panden: [VOLLEDIG_PAND],
    dossiers: [{ dossier_id: 'd1', status: 'open', energie_snapshot: { band: {} }, mjop_snapshot: { components: [{ id: 1 }] }, panden: VOLLEDIG_PAND }],
  })
  assert.deepEqual(acties, [])
})

test('bouwAccountActies: onvolledige klantgegevens geven één contactgegevens-actie', () => {
  const acties = bouwAccountActies({ klant: null, contactpersoon: null, panden: [], dossiers: [] })
  assert.equal(acties.length, 1)
  assert.equal(acties[0].categorie, 'klant')
})

test('bouwAccountActies: onvolledig pand geeft een pand-actie per pand', () => {
  const acties = bouwAccountActies({
    klant: VOLLEDIGE_KLANT,
    contactpersoon: VOLLEDIG_CONTACT,
    panden: [{ omschrijving: 'Pand zonder adres' }],
    dossiers: [],
  })
  assert.equal(acties.length, 1)
  assert.equal(acties[0].categorie, 'pand')
  assert.match(acties[0].label, /Pand zonder adres/)
})

test('bouwAccountActies: ontbrekende energie/mjop bij een open dossier geven twee acties', () => {
  const acties = bouwAccountActies({
    klant: VOLLEDIGE_KLANT,
    contactpersoon: VOLLEDIG_CONTACT,
    panden: [VOLLEDIG_PAND],
    dossiers: [{ dossier_id: 'd1', status: 'open', energie_snapshot: null, mjop_snapshot: null, panden: VOLLEDIG_PAND }],
  })
  const categorieen = acties.map((a) => a.categorie).sort()
  assert.deepEqual(categorieen, ['energie', 'mjop'])
})

test('bouwAccountActies: afgeronde dossiers leveren geen energie/mjop-acties op', () => {
  const acties = bouwAccountActies({
    klant: VOLLEDIGE_KLANT,
    contactpersoon: VOLLEDIG_CONTACT,
    panden: [VOLLEDIG_PAND],
    dossiers: [{ dossier_id: 'd1', status: 'afgerond', energie_snapshot: null, mjop_snapshot: null, panden: VOLLEDIG_PAND }],
  })
  assert.deepEqual(acties, [])
})

test('bouwAccountActies: nooit een advies- of offerte-categorie — dat blijft aan SMV', () => {
  const acties = bouwAccountActies({
    klant: VOLLEDIGE_KLANT,
    contactpersoon: VOLLEDIG_CONTACT,
    panden: [VOLLEDIG_PAND],
    dossiers: [{ dossier_id: 'd1', status: 'open', energie_snapshot: null, mjop_snapshot: null, panden: VOLLEDIG_PAND }],
  })
  const categorieen = acties.map((a) => a.categorie)
  assert.ok(!categorieen.includes('advies'))
  assert.ok(!categorieen.includes('offerte'))
})

test('bouwAccountActies: elke actie bevat een navigeerbare bestemming', () => {
  const acties = bouwAccountActies({ klant: null, contactpersoon: null, panden: [], dossiers: [] })
  for (const actie of acties) {
    assert.ok(actie.actie?.to)
  }
})
