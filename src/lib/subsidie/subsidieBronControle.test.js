import { test } from 'node:test'
import assert from 'node:assert/strict'
import { valideerControleDatum, controleerBronnen } from './subsidieBronControle.js'

const VANDAAG = new Date('2026-10-08T12:00:00Z')

test('geldige, in het verleden gecontroleerde datum -> geldig', () => {
  const r = valideerControleDatum('2026-10-08', VANDAAG)
  assert.equal(r.geldig, true)
})

test('datum in het verleden (eerder jaar) -> geldig', () => {
  const r = valideerControleDatum('2025-01-01', VANDAAG)
  assert.equal(r.geldig, true)
})

test('datum ÉÉN DAG in de toekomst -> ongeldig, met duidelijke reden (opdracht §20, de exacte bug van de vorige ronde)', () => {
  const r = valideerControleDatum('2026-10-09', VANDAAG)
  assert.equal(r.geldig, false)
  assert.match(r.reden, /toekomst/)
})

test('geen datum -> ongeldig', () => {
  const r = valideerControleDatum(null, VANDAAG)
  assert.equal(r.geldig, false)
})

test('ongeldige datumstring -> ongeldig, crasht niet', () => {
  const r = valideerControleDatum('niet-een-datum', VANDAAG)
  assert.equal(r.geldig, false)
})

test('controleerBronnen annoteert elke bron met het validatieresultaat, zonder de oorspronkelijke velden te verliezen', () => {
  const bronnen = [{ label: 'RVO', url: 'https://www.rvo.nl/x', gecontroleerdOp: '2026-10-08' }]
  const geannoteerd = controleerBronnen(bronnen, VANDAAG)
  assert.equal(geannoteerd[0].label, 'RVO')
  assert.equal(geannoteerd[0].controle.geldig, true)
})

test('controleerBronnen signaleert een toekomstige datum per bron, zonder de andere bronnen te beïnvloeden', () => {
  const bronnen = [
    { label: 'Geldig', url: 'https://www.rvo.nl/a', gecontroleerdOp: '2026-10-08' },
    { label: 'Fout', url: 'https://www.rvo.nl/b', gecontroleerdOp: '2026-12-01' },
  ]
  const geannoteerd = controleerBronnen(bronnen, VANDAAG)
  assert.equal(geannoteerd[0].controle.geldig, true)
  assert.equal(geannoteerd[1].controle.geldig, false)
})
