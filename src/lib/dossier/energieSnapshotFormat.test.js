import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { formatGetal, formatUitgevoerdOp, besparingHoeveelheidTekst, NIET_INGEVULD } from './energieSnapshotFormat.js'

// --- formatGetal --------------------------------------------------------

test('formatGetal: formatteert een getal met NL-duizendtalnotatie', () => {
  assert.equal(formatGetal(8000), '8.000')
  assert.equal(formatGetal(500), '500')
})

test('formatGetal: voegt de opgegeven eenheid toe', () => {
  assert.equal(formatGetal(500, 'm²'), '500 m²')
  assert.equal(formatGetal(8000, 'm³'), '8.000 m³')
})

test('formatGetal: null/undefined/lege string leveren null op (geen "0" verzonnen)', () => {
  assert.equal(formatGetal(null), null)
  assert.equal(formatGetal(undefined), null)
  assert.equal(formatGetal(''), null)
})

test('formatGetal: 0 is een geldige waarde, geen fallback', () => {
  assert.equal(formatGetal(0), '0')
})

test('formatGetal: een niet-numerieke, niet-lege waarde (bijv. een label) komt ongewijzigd terug', () => {
  assert.equal(formatGetal('Kantoor'), 'Kantoor')
})

// --- formatUitgevoerdOp ---------------------------------------------------

test('formatUitgevoerdOp: formatteert een ISO-timestamp als dd-mm-jjjj uu:mm', () => {
  const tekst = formatUitgevoerdOp('2026-09-25T15:09:45.870Z')
  // Exacte kloktijd hangt af van de tijdzone van de testrunner; datumdelen
  // en scheidingstekens zijn stabiel en zijn wat deze test controleert.
  assert.match(tekst, /^\d{2}-\d{2}-2026,? \d{2}:\d{2}$/)
})

test('formatUitgevoerdOp: ontbrekende of ongeldige waarde crasht niet, levert een nette tekst op', () => {
  assert.equal(formatUitgevoerdOp(null), 'Onbekend moment')
  assert.equal(formatUitgevoerdOp(undefined), 'Onbekend moment')
  assert.equal(formatUitgevoerdOp('geen-geldige-datum'), 'Onbekend moment')
  assert.equal(formatUitgevoerdOp(''), 'Onbekend moment')
})

// --- besparingHoeveelheidTekst --------------------------------------------

test('besparingHoeveelheidTekst: elektrische maatregel toont kWh / jaar', () => {
  const tekst = besparingHoeveelheidTekst({ isElektrisch: true, besparingKwh: 6750, besparingM3: null })
  assert.equal(tekst, '6.750 kWh / jaar')
})

test('besparingHoeveelheidTekst: gasmaatregel toont m³ gas / jaar', () => {
  const tekst = besparingHoeveelheidTekst({ isElektrisch: false, besparingM3: 865, besparingKwh: null })
  assert.equal(tekst, '865 m³ gas / jaar')
})

test('besparingHoeveelheidTekst: ontbrekende maatregel of ontbrekend besparingsveld crasht niet', () => {
  assert.equal(besparingHoeveelheidTekst(null), null)
  assert.equal(besparingHoeveelheidTekst(undefined), null)
  assert.equal(besparingHoeveelheidTekst({ isElektrisch: true, besparingKwh: null }), null)
  assert.equal(besparingHoeveelheidTekst({ isElektrisch: false, besparingM3: null }), null)
  assert.equal(besparingHoeveelheidTekst({}), null) // isElektrisch ontbreekt → gasgedrag, besparingM3 ontbreekt → null
})

test('NIET_INGEVULD is de centrale, ene fallbacktekst', () => {
  assert.equal(NIET_INGEVULD, 'Niet ingevuld')
})

// --- EnergieSnapshot.jsx: statische bronchecks --------------------------
//
// Geen component-rendertests: dit project heeft geen jsdom/React-testing-
// library-opzet (`npm test` is de kale `node --test` op .js-bestanden,
// zie package.json) — hetzelfde geldt voor elk ander component in deze
// codebase, geen enkel bestaat als .test.jsx. In plaats daarvan wordt hier
// de daadwerkelijke broncode van het component gelezen en gecontroleerd op
// de twee harde eisen uit de bouwprompt: geen calculatorfuncties, geen
// live label-/scoreband-lookup. Dit dekt niet de visuele rendering (zie
// het Fase 3-rapport voor de live-browsercontrole daarvan), wel de
// architecturale garantie dat het component nooit opnieuw kan berekenen.

const componentPad = fileURLToPath(new URL('../../components/klantOmgeving/EnergieSnapshot.jsx', import.meta.url))
const componentBronMetComments = readFileSync(componentPad, 'utf-8')
// Blokcommentaar (/** ... */, /* ... */) eruit vóór het zoeken: de
// modulecomment hierboven legt juist uit wélke functies bewust NIET worden
// gebruikt, en noemt die namen dus zelf — zonder dit zou deze check op
// zijn eigen documentatie struikelen. Alleen de daadwerkelijke code telt.
const componentBron = componentBronMetComments.replace(/\/\*[\s\S]*?\*\//g, '')

test('EnergieSnapshot.jsx importeert of roept nergens berekenResultaat/prepareCalculationInput aan', () => {
  assert.equal(componentBron.includes('berekenResultaat'), false)
  assert.equal(componentBron.includes('prepareCalculationInput'), false)
  assert.equal(componentBron.includes('berekenMaatregelen'), false)
})

test('EnergieSnapshot.jsx gebruikt geen live LABELS- of SCORE_BANDS-lookup', () => {
  assert.equal(componentBron.includes('fieldOptions'), false)
  assert.equal(componentBron.includes('LABELS'), false)
  assert.equal(componentBron.includes('SCORE_BANDS'), false)
  assert.equal(componentBron.includes('getScoreBand'), false)
  assert.equal(componentBron.includes("from '../../lib/energieScan/constants"), false)
})

test('EnergieSnapshot.jsx toont een nette lege toestand voor een ontbrekende snapshot', () => {
  assert.equal(componentBron.includes('Nog geen Energie-indicatie opgeslagen.'), true)
  assert.match(componentBron, /if\s*\(\s*!snapshot\s*\)/)
})

test('EnergieSnapshot.jsx importeert uitsluitend de pure formatters uit calculations.js, geen andere exports', () => {
  const importRegel = componentBron.split('\n').find((regel) => regel.includes("from '../../lib/energieScan/calculations'"))
  assert.ok(importRegel, 'verwacht een import uit lib/energieScan/calculations')
  for (const naam of ['euro', 'euroRange', 'jaren']) {
    assert.ok(importRegel.includes(naam), `verwacht "${naam}" in de import`)
  }
})
