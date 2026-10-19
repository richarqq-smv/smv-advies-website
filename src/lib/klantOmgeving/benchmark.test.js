import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bouwBenchmark, BENCHMARK_MINIMUM_VERGELIJKINGSGROEP } from './benchmark.js'

function dossier(id, kosten, oppervlak) {
  return {
    dossier_id: id,
    energie_snapshot: kosten != null ? { resultaat: { huidigeKosten: kosten } } : null,
    pand_snapshot: oppervlak != null ? { vloeroppervlak: oppervlak } : null,
  }
}

test('bouwBenchmark: eigen dossier zonder bruikbare data geeft null, ook met genoeg vergelijkingsmateriaal', () => {
  const alle = [dossier('eigen', null, null), dossier('a', 1000, 500), dossier('b', 1200, 600), dossier('c', 900, 450)]
  assert.equal(bouwBenchmark('eigen', alle), null)
})

test('bouwBenchmark: minder dan de ondergrens aan andere dossiers met data geeft null (bv. maar 2)', () => {
  const alle = [dossier('eigen', 1000, 500), dossier('a', 1000, 500), dossier('b', 1200, 600)]
  assert.equal(bouwBenchmark('eigen', alle), null)
  assert.equal(BENCHMARK_MINIMUM_VERGELIJKINGSGROEP, 3)
})

test('bouwBenchmark: precies de ondergrens geeft wel een resultaat, met het juiste gemiddelde (eigen dossier nooit meegerekend)', () => {
  const alle = [
    dossier('eigen', 1000, 500), // 2 €/m²
    dossier('a', 1000, 500), // 2
    dossier('b', 1200, 600), // 2
    dossier('c', 900, 450), // 2
  ]
  const resultaat = bouwBenchmark('eigen', alle)
  assert.deepEqual(resultaat, { eigenWaarde: 2, gemiddelde: 2, aantalVergeleken: 3 })
})

test('bouwBenchmark: dossiers zonder bruikbare data (geen energie_snapshot of geen vloeroppervlak) tellen niet mee in het gemiddelde of de ondergrens', () => {
  const alle = [
    dossier('eigen', 1000, 500),
    dossier('a', 1000, 500),
    dossier('b', 1200, 600),
    dossier('c', 900, 450),
    dossier('d', null, null), // geen energie-indicatie
    dossier('e', 800, null), // geen vloeroppervlak bekend
  ]
  const resultaat = bouwBenchmark('eigen', alle)
  assert.equal(resultaat.aantalVergeleken, 3)
})

test('bouwBenchmark: afronding op hele euro, geen decimalen in de weergave-waarden', () => {
  const alle = [dossier('eigen', 1000, 333), dossier('a', 999, 333), dossier('b', 1001, 333), dossier('c', 1234, 333)]
  const resultaat = bouwBenchmark('eigen', alle)
  assert.equal(Number.isInteger(resultaat.eigenWaarde), true)
  assert.equal(Number.isInteger(resultaat.gemiddelde), true)
})

test('bouwBenchmark: lege/ontbrekende lijst geeft null, nooit een crash', () => {
  assert.equal(bouwBenchmark('eigen', []), null)
  assert.equal(bouwBenchmark('eigen', undefined), null)
})
