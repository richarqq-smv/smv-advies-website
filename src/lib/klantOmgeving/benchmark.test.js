import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bouwBenchmark, BENCHMARK_MINIMUM_VERGELIJKINGSGROEP } from './benchmark.js'

function dossier(id, kosten, oppervlak, gebruikstype = 'kantoor') {
  return {
    dossier_id: id,
    energie_snapshot: kosten != null ? { resultaat: { huidigeKosten: kosten } } : null,
    pand_snapshot: oppervlak != null || gebruikstype != null ? { vloeroppervlak: oppervlak, gebruikstype } : null,
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
  assert.deepEqual(resultaat, { eigenWaarde: 2, gemiddelde: 2, aantalVergeleken: 3, gebruikstype: 'kantoor' })
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

// Correctieronde (2026-10-19): de vergelijkingsgroep werd tot nu toe nooit
// op enig vergelijkbaarheidskenmerk gefilterd, terwijl de UI het resultaat
// wél "gemiddelde van vergelijkbare dossiers" noemde. Nu wordt de groep
// beperkt tot dossiers met hetzelfde gebruikstype (de enige structurele
// classificatie die al in de brondata bestaat).

test('correctieronde — bouwBenchmark: sluit dossiers met een ANDER gebruikstype uit van de vergelijkingsgroep', () => {
  const alle = [
    dossier('eigen', 1000, 500, 'kantoor'),
    dossier('a', 1000, 500, 'kantoor'),
    dossier('b', 1200, 600, 'kantoor'),
    dossier('c', 900, 450, 'kantoor'),
    dossier('d', 5000, 500, 'bedrijfshal'), // ander gebruikstype — zou het gemiddelde flink verstoren als het meetelde
    dossier('e', 6000, 500, 'bedrijfshal'),
  ]
  const resultaat = bouwBenchmark('eigen', alle)
  assert.equal(resultaat.aantalVergeleken, 3)
  assert.equal(resultaat.gemiddelde, 2)
  assert.equal(resultaat.gebruikstype, 'kantoor')
})

test('correctieronde — bouwBenchmark: een eigen dossier zonder bekend gebruikstype geeft null (geen vergelijkingsgroep vast te stellen)', () => {
  const alle = [
    { dossier_id: 'eigen', energie_snapshot: { resultaat: { huidigeKosten: 1000 } }, pand_snapshot: { vloeroppervlak: 500, gebruikstype: null } },
    dossier('a', 1000, 500),
    dossier('b', 1200, 600),
    dossier('c', 900, 450),
  ]
  assert.equal(bouwBenchmark('eigen', alle), null)
})

test('correctieronde — bouwBenchmark: genoeg dossiers in totaal, maar te weinig met hetzelfde gebruikstype, geeft null', () => {
  const alle = [
    dossier('eigen', 1000, 500, 'kantoor'),
    dossier('a', 1000, 500, 'kantoor'), // maar 1 andere met hetzelfde gebruikstype
    dossier('b', 1200, 600, 'bedrijfshal'),
    dossier('c', 900, 450, 'winkel'),
  ]
  assert.equal(bouwBenchmark('eigen', alle), null)
})
