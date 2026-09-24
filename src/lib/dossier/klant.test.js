import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createKlant, createContactpersoon, addContactpersoon } from './klant.js'

test('Klant krijgt een unieke ID', () => {
  const a = createKlant({ naam: 'A' })
  const b = createKlant({ naam: 'B' })
  assert.ok(a.klantId)
  assert.notEqual(a.klantId, b.klantId)
})

test('een Klant kan meerdere Contactpersonen hebben', () => {
  let klant = createKlant({ naam: 'Fictief Bedrijf' })
  const eigenaar = createContactpersoon({ naam: 'Eigenaar', rol: 'eigenaar' })
  const facilitair = createContactpersoon({ naam: 'Facilitair', rol: 'facilitair' })

  klant = addContactpersoon(klant, eigenaar)
  klant = addContactpersoon(klant, facilitair)

  assert.equal(klant.contactpersonen.length, 2)
  assert.notEqual(eigenaar.contactpersoonId, facilitair.contactpersoonId)
})

test('addContactpersoon muteert de oorspronkelijke Klant niet', () => {
  const origineel = createKlant({ naam: 'Fictief Bedrijf' })
  const contact = createContactpersoon({ naam: 'Iemand' })
  const bijgewerkt = addContactpersoon(origineel, contact)

  assert.equal(origineel.contactpersonen.length, 0)
  assert.equal(bijgewerkt.contactpersonen.length, 1)
})
