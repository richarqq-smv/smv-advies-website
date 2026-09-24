import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPand, updatePand } from './pand.js'

test('Pand krijgt een unieke ID', () => {
  const a = createPand({ bouwjaar: 1987 })
  const b = createPand({ bouwjaar: 1987 })
  assert.ok(a.pandId)
  assert.notEqual(a.pandId, b.pandId)
})

test('een leeg veld betekent onbekend, geen blokkade', () => {
  const pand = createPand()
  assert.equal(pand.bouwjaar, null)
  assert.equal(pand.gebruikstype, null)
})

test('updatePand wijzigt het Pand zonder de pandId of aangemaaktOp te veranderen', () => {
  const pand = createPand({ bouwjaar: 1987, gebruikstype: 'kantoor' })
  const bijgewerkt = updatePand(pand, { bouwjaar: 1986, gebruikstype: 'bedrijfsruimte' })

  assert.equal(bijgewerkt.pandId, pand.pandId)
  assert.equal(bijgewerkt.aangemaaktOp, pand.aangemaaktOp)
  assert.equal(bijgewerkt.bouwjaar, 1986)
  assert.equal(bijgewerkt.gebruikstype, 'bedrijfsruimte')
  // het oorspronkelijke Pandobject blijft ongewijzigd (immutable update)
  assert.equal(pand.bouwjaar, 1987)
})
