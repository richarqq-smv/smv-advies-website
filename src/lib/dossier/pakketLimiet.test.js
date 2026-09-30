import { test } from 'node:test'
import assert from 'node:assert/strict'
import { magAdviespuntToevoegen, pakketLimietMelding, GOLD_MAX_ADVIESPUNTEN } from './pakketLimiet.js'

test('magAdviespuntToevoegen: basis/premium/onbekend pakket kent geen grens', () => {
  assert.equal(magAdviespuntToevoegen({ pakketId: 'basis', huidigAantal: 50 }), true)
  assert.equal(magAdviespuntToevoegen({ pakketId: 'premium', huidigAantal: 50 }), true)
  assert.equal(magAdviespuntToevoegen({ pakketId: null, huidigAantal: 50 }), true)
})

test('magAdviespuntToevoegen: gold staat toe tot en met het maximum, blokkeert daarna', () => {
  assert.equal(magAdviespuntToevoegen({ pakketId: 'gold', huidigAantal: 0 }), true)
  assert.equal(magAdviespuntToevoegen({ pakketId: 'gold', huidigAantal: GOLD_MAX_ADVIESPUNTEN - 1 }), true)
  assert.equal(magAdviespuntToevoegen({ pakketId: 'gold', huidigAantal: GOLD_MAX_ADVIESPUNTEN }), false)
  assert.equal(magAdviespuntToevoegen({ pakketId: 'gold', huidigAantal: GOLD_MAX_ADVIESPUNTEN + 5 }), false)
})

test('magAdviespuntToevoegen: ontbrekend aantal (undefined/null) behandeld als 0, nooit een crash', () => {
  assert.equal(magAdviespuntToevoegen({ pakketId: 'gold', huidigAantal: undefined }), true)
  assert.equal(magAdviespuntToevoegen({ pakketId: 'gold' }), true)
})

test('pakketLimietMelding: null zolang er geen grens is bereikt', () => {
  assert.equal(pakketLimietMelding({ pakketId: 'basis', huidigAantal: 99 }), null)
  assert.equal(pakketLimietMelding({ pakketId: 'gold', huidigAantal: 2 }), null)
})

test('pakketLimietMelding: duidelijke tekst zodra de grens is bereikt', () => {
  const melding = pakketLimietMelding({ pakketId: 'gold', huidigAantal: 3 })
  assert.match(melding, /maximum/)
  assert.match(melding, /3/)
})
