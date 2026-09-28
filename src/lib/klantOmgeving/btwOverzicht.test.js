import { test } from 'node:test'
import assert from 'node:assert/strict'
import { berekenBtwPeriode, formatBtwPeriodeLabel, berekenBtwOverzicht, vorigePeriodeAnker } from './btwOverzicht.js'

// --- berekenBtwPeriode --------------------------------------------------

test('berekenBtwPeriode: maand geeft de eerste en laatste dag van die maand', () => {
  assert.deepEqual(berekenBtwPeriode('maand', '2026-09-15'), { vanaf: '2026-09-01', tot: '2026-09-30' })
})

test('berekenBtwPeriode: maand houdt rekening met een langere maand', () => {
  assert.deepEqual(berekenBtwPeriode('maand', '2026-01-15'), { vanaf: '2026-01-01', tot: '2026-01-31' })
})

test('berekenBtwPeriode: kwartaal geeft de juiste 3 maanden (Q4)', () => {
  assert.deepEqual(berekenBtwPeriode('kwartaal', '2026-11-15'), { vanaf: '2026-10-01', tot: '2026-12-31' })
})

test('berekenBtwPeriode: kwartaal geeft de juiste 3 maanden (Q1)', () => {
  assert.deepEqual(berekenBtwPeriode('kwartaal', '2026-02-15'), { vanaf: '2026-01-01', tot: '2026-03-31' })
})

test('berekenBtwPeriode: jaar geeft 1 januari t/m 31 december', () => {
  assert.deepEqual(berekenBtwPeriode('jaar', '2026-06-15'), { vanaf: '2026-01-01', tot: '2026-12-31' })
})

// --- formatBtwPeriodeLabel --------------------------------------------------

test('formatBtwPeriodeLabel: kwartaal', () => {
  assert.equal(formatBtwPeriodeLabel('kwartaal', '2026-11-15'), 'Q4 2026')
})

test('formatBtwPeriodeLabel: jaar', () => {
  assert.equal(formatBtwPeriodeLabel('jaar', '2026-11-15'), '2026')
})

test('formatBtwPeriodeLabel: maand', () => {
  assert.match(formatBtwPeriodeLabel('maand', '2026-09-15'), /september 2026/)
})

// --- berekenBtwOverzicht --------------------------------------------------

function factuur(overrides = {}) {
  return { status: 'verzonden', subtotaal_excl_btw: 100, btw_bedrag: 21, ...overrides }
}
function kostenpost(overrides = {}) {
  return { bedrag_excl_btw: 50, btw_bedrag: 10.5, ...overrides }
}

test('berekenBtwOverzicht: telt verzonden/betaald/vervallen facturen mee als omzet', () => {
  const overzicht = berekenBtwOverzicht({
    facturen: [factuur({ status: 'verzonden' }), factuur({ status: 'betaald' }), factuur({ status: 'vervallen' })],
    kosten: [],
  })
  assert.equal(overzicht.omzetExclBtw, 300)
  assert.equal(overzicht.btwVerkoop, 63)
})

test('berekenBtwOverzicht: telt concept en geannuleerde facturen NIET mee', () => {
  const overzicht = berekenBtwOverzicht({
    facturen: [factuur({ status: 'concept' }), factuur({ status: 'geannuleerd' }), factuur({ status: 'verzonden' })],
    kosten: [],
  })
  assert.equal(overzicht.omzetExclBtw, 100)
  assert.equal(overzicht.facturenMeegeteld.length, 1)
})

test('berekenBtwOverzicht: telt kosten op ongeacht status', () => {
  const overzicht = berekenBtwOverzicht({ facturen: [], kosten: [kostenpost({ status: 'open' }), kostenpost({ status: 'betaald' })] })
  assert.equal(overzicht.kostenExclBtw, 100)
  assert.equal(overzicht.btwAftrekbaar, 21)
})

test('berekenBtwOverzicht: saldo is btw-verkoop minus aftrekbare btw', () => {
  const overzicht = berekenBtwOverzicht({ facturen: [factuur()], kosten: [kostenpost()] })
  assert.equal(overzicht.saldo, 21 - 10.5)
})

test('berekenBtwOverzicht: leeg blijft leeg, geen crash', () => {
  const overzicht = berekenBtwOverzicht({})
  assert.equal(overzicht.omzetExclBtw, 0)
  assert.equal(overzicht.saldo, 0)
})

// --- vorigePeriodeAnker --------------------------------------------------

test('vorigePeriodeAnker: maand gaat één maand terug', () => {
  assert.deepEqual(berekenBtwPeriode('maand', vorigePeriodeAnker('maand', '2026-09-15')), { vanaf: '2026-08-01', tot: '2026-08-31' })
})

test('vorigePeriodeAnker: maand over een jaargrens (januari -> december vorig jaar)', () => {
  assert.deepEqual(berekenBtwPeriode('maand', vorigePeriodeAnker('maand', '2026-01-15')), { vanaf: '2025-12-01', tot: '2025-12-31' })
})

test('vorigePeriodeAnker: maand blijft correct bij een korte doelmaand (31 maart -> februari, niet april)', () => {
  assert.deepEqual(berekenBtwPeriode('maand', vorigePeriodeAnker('maand', '2026-03-31')), { vanaf: '2026-02-01', tot: '2026-02-28' })
})

test('vorigePeriodeAnker: kwartaal gaat één kwartaal terug (Q4 -> Q3)', () => {
  assert.deepEqual(berekenBtwPeriode('kwartaal', vorigePeriodeAnker('kwartaal', '2026-11-15')), { vanaf: '2026-07-01', tot: '2026-09-30' })
})

test('vorigePeriodeAnker: kwartaal over een jaargrens (Q1 -> Q4 vorig jaar)', () => {
  assert.deepEqual(berekenBtwPeriode('kwartaal', vorigePeriodeAnker('kwartaal', '2026-02-15')), { vanaf: '2025-10-01', tot: '2025-12-31' })
})

test('vorigePeriodeAnker: jaar gaat één jaar terug', () => {
  assert.deepEqual(berekenBtwPeriode('jaar', vorigePeriodeAnker('jaar', '2026-06-15')), { vanaf: '2025-01-01', tot: '2025-12-31' })
})
