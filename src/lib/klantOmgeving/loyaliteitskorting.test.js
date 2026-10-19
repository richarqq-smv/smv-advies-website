import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bouwKortingOpties, bouwKortingCode } from './loyaliteitskorting.js'

test('bouwKortingOpties: Basis krijgt 3 opties — 4,5% zelfde, 9,5% naar Premium, 15% naar Gold', () => {
  const opties = bouwKortingOpties('basis')
  assert.equal(opties.length, 3)
  assert.deepEqual(
    opties.map((o) => [o.doelPakketId, o.percentage]),
    [['basis', 4.5], ['premium', 9.5], ['gold', 15]],
  )
})

test('bouwKortingOpties: Premium krijgt 2 opties — 4,5% zelfde, 9,5% naar Gold', () => {
  const opties = bouwKortingOpties('premium')
  assert.equal(opties.length, 2)
  assert.deepEqual(
    opties.map((o) => [o.doelPakketId, o.percentage]),
    [['premium', 4.5], ['gold', 9.5]],
  )
})

test('bouwKortingOpties: Gold krijgt 1 optie — 4,5% zelfde, geen hogere tier mogelijk', () => {
  const opties = bouwKortingOpties('gold')
  assert.equal(opties.length, 1)
  assert.deepEqual(opties.map((o) => [o.doelPakketId, o.percentage]), [['gold', 4.5]])
})

test('bouwKortingOpties: onbekend/ontbrekend pakketId geeft lege lijst, nooit een gok', () => {
  assert.deepEqual(bouwKortingOpties('onbekend-pakket'), [])
  assert.deepEqual(bouwKortingOpties(null), [])
  assert.deepEqual(bouwKortingOpties(undefined), [])
})

test('bouwKortingCode: deterministisch opgebouwd uit het dossiernummer, direct herleidbaar', () => {
  assert.equal(bouwKortingCode('SMV-DOS-2026-0042'), 'LOY-SMV-DOS-2026-0042')
})

test('bouwKortingCode: geen dossiernummer geeft geen code, nooit een onherleidbare placeholder', () => {
  assert.equal(bouwKortingCode(null), null)
  assert.equal(bouwKortingCode(undefined), null)
  assert.equal(bouwKortingCode(''), null)
})
