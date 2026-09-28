import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  PUBLIEKE_AANDACHTSPUNTEN_MAX,
  buildPubliekeAandachtspunten,
  buildKostenBandbreedte,
  formatKostenBandbreedte,
  buildPubliekeMaatregelenTekst,
  WAT_WEET_DEZE_INDICATIE_NIET,
} from './publiekeWeergave.js'

function maatregelen() {
  return [
    { naam: 'Overstap naar warmtepomp', toelichting: 'Vervang het gasverwarmingssysteem.', besparingEuro: 8033, investeringLaag: 27500, investeringHoog: 47500, terugverdientijd: 4.7 },
    { naam: 'Dakisolatie', toelichting: 'Isoleer het dak.', besparingEuro: 2600, investeringLaag: 8750, investeringHoog: 13750, terugverdientijd: 4.3 },
    { naam: 'Gevelisolatie', toelichting: 'Isoleer de buitenmuren.', besparingEuro: 2486, investeringLaag: 27094, investeringHoog: 41438, terugverdientijd: 13.8 },
    { naam: 'LED-verlichting', toelichting: 'Vervang bestaande verlichting.', besparingEuro: 1890, investeringLaag: 3500, investeringHoog: 6000, terugverdientijd: 2.5 },
    { naam: 'HR++ beglazing', toelichting: 'Vervang enkel of dubbel glas.', besparingEuro: 1611, investeringLaag: 52064, investeringHoog: 71898, terugverdientijd: 38.5 },
  ]
}

// --- buildPubliekeAandachtspunten -------------------------------------------

test('buildPubliekeAandachtspunten: levert maximaal PUBLIEKE_AANDACHTSPUNTEN_MAX punten op', () => {
  const punten = buildPubliekeAandachtspunten(maatregelen())
  assert.equal(punten.length, PUBLIEKE_AANDACHTSPUNTEN_MAX)
  assert.equal(punten.length, 3)
})

test('buildPubliekeAandachtspunten: behoudt de volgorde van de calculator (op besparingspotentieel)', () => {
  const punten = buildPubliekeAandachtspunten(maatregelen())
  assert.deepEqual(punten.map((p) => p.naam), ['Overstap naar warmtepomp', 'Dakisolatie', 'Gevelisolatie'])
})

test('buildPubliekeAandachtspunten: bevat uitsluitend naam en toelichting, nooit bedragen of terugverdientijd', () => {
  const punten = buildPubliekeAandachtspunten(maatregelen())
  for (const punt of punten) {
    assert.deepEqual(Object.keys(punt).sort(), ['naam', 'toelichting'])
    assert.equal('besparingEuro' in punt, false)
    assert.equal('investeringLaag' in punt, false)
    assert.equal('investeringHoog' in punt, false)
    assert.equal('terugverdientijd' in punt, false)
  }
})

test('buildPubliekeAandachtspunten: minder dan 3 maatregelen levert precies dat aantal op, geen verzonnen extra\'s', () => {
  const punten = buildPubliekeAandachtspunten(maatregelen().slice(0, 2))
  assert.equal(punten.length, 2)
})

test('buildPubliekeAandachtspunten: null/undefined/geen array crasht niet, levert lege array op', () => {
  assert.deepEqual(buildPubliekeAandachtspunten(null), [])
  assert.deepEqual(buildPubliekeAandachtspunten(undefined), [])
  assert.deepEqual(buildPubliekeAandachtspunten('geen-array'), [])
})

// --- buildKostenBandbreedte / formatKostenBandbreedte -----------------------

test('buildKostenBandbreedte: levert een laag/hoog-bandbreedte rond het bedrag, geen exact bedrag', () => {
  const band = buildKostenBandbreedte(27615)
  assert.ok(band.laag < 27615)
  assert.ok(band.hoog > 27615)
})

test('buildKostenBandbreedte: laag en hoog zijn afgeronde bedragen (geen valse precisie)', () => {
  const band = buildKostenBandbreedte(27615)
  assert.equal(band.laag % 500, 0)
  assert.equal(band.hoog % 500, 0)
})

test('buildKostenBandbreedte: laag is nooit negatief', () => {
  const band = buildKostenBandbreedte(100)
  assert.ok(band.laag >= 0)
})

test('buildKostenBandbreedte: null/undefined levert null op, geen crash', () => {
  assert.equal(buildKostenBandbreedte(null), null)
  assert.equal(buildKostenBandbreedte(undefined), null)
})

test('formatKostenBandbreedte: levert een leesbare "laag – hoog / jaar"-tekst op', () => {
  const tekst = formatKostenBandbreedte(27615)
  assert.match(tekst, /^€ [\d.]+ – € [\d.]+ \/ jaar$/)
})

test('formatKostenBandbreedte: null levert null op, geen "€ null"-tekst', () => {
  assert.equal(formatKostenBandbreedte(null), null)
})

// --- buildPubliekeMaatregelenTekst ------------------------------------------

test('buildPubliekeMaatregelenTekst: bevat de aandachtspunten, nooit een eurobedrag of "terugverdientijd"', () => {
  const tekst = buildPubliekeMaatregelenTekst(maatregelen())
  assert.match(tekst, /Overstap naar warmtepomp/)
  assert.match(tekst, /Dakisolatie/)
  assert.equal(/€/.test(tekst), false)
  assert.equal(/terugverdientijd/i.test(tekst), false)
})

test('buildPubliekeMaatregelenTekst: lege lijst levert een nette tekst op, geen crash', () => {
  const tekst = buildPubliekeMaatregelenTekst([])
  assert.equal(typeof tekst, 'string')
  assert.ok(tekst.length > 0)
})

// --- WAT_WEET_DEZE_INDICATIE_NIET --------------------------------------------

test('WAT_WEET_DEZE_INDICATIE_NIET: is een niet-lege lijst van tekstregels', () => {
  assert.ok(Array.isArray(WAT_WEET_DEZE_INDICATIE_NIET))
  assert.ok(WAT_WEET_DEZE_INDICATIE_NIET.length > 0)
  for (const regel of WAT_WEET_DEZE_INDICATIE_NIET) assert.equal(typeof regel, 'string')
})
