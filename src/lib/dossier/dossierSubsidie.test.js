import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SUBSIDIE_STATUSSEN, sorteerSubsidies, subsidieStatusLabel } from './dossierSubsidie.js'

test('SUBSIDIE_STATUSSEN: exact de 5 statussen uit de check-constraint, in logische volgorde', () => {
  assert.deepEqual(
    SUBSIDIE_STATUSSEN.map((s) => s.value),
    ['voorbereiding', 'ingediend', 'toegekend', 'afgewezen', 'verantwoord'],
  )
})

test('sorteerSubsidies: sorteert op created_at, oudste eerst', () => {
  const subsidies = [
    { subsidie_id: 'b', created_at: '2026-02-01' },
    { subsidie_id: 'a', created_at: '2026-01-01' },
  ]
  assert.deepEqual(sorteerSubsidies(subsidies).map((s) => s.subsidie_id), ['a', 'b'])
})

test('sorteerSubsidies: lege input geeft lege lijst, nooit een crash', () => {
  assert.deepEqual(sorteerSubsidies([]), [])
})

test('sorteerSubsidies: muteert de input-array niet', () => {
  const subsidies = [{ created_at: '2026-02-01' }, { created_at: '2026-01-01' }]
  const origineel = [...subsidies]
  sorteerSubsidies(subsidies)
  assert.deepEqual(subsidies, origineel)
})

test('subsidieStatusLabel: geeft het juiste label per bekende status', () => {
  assert.equal(subsidieStatusLabel('voorbereiding'), 'Voorbereiding')
  assert.equal(subsidieStatusLabel('toegekend'), 'Toegekend')
  assert.equal(subsidieStatusLabel('afgewezen'), 'Afgewezen')
})

test('subsidieStatusLabel: onbekende/lege status geeft de ruwe waarde terug, nooit een crash', () => {
  assert.equal(subsidieStatusLabel('iets_onbekends'), 'iets_onbekends')
  assert.equal(subsidieStatusLabel(null), '')
  assert.equal(subsidieStatusLabel(undefined), '')
})
