import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bouwGeraakteDossiers, controleIsVerouderd, laatsteControleDatum, CONTROLE_DREMPEL_DAGEN } from './subsidieDeadlineMatching.js'

function dossierSubsidie(regelingNaam, status, dossierStatus = 'open') {
  return { regeling_naam: regelingNaam, status, dossiers: { status: dossierStatus } }
}

test('bouwGeraakteDossiers: matcht hoofdletterongevoelig en op "bevat", niet alleen exacte match', () => {
  const alle = [dossierSubsidie('ISDE renovatie warmtepomp', 'voorbereiding'), dossierSubsidie('eia 2026', 'ingediend')]
  const isde = bouwGeraakteDossiers({ regeling: 'ISDE' }, alle)
  assert.equal(isde.length, 1)
  const eia = bouwGeraakteDossiers({ regeling: 'EIA' }, alle)
  assert.equal(eia.length, 1)
})

test('bouwGeraakteDossiers: sluit afgesloten subsidietrajecten uit (toegekend/afgewezen/verantwoord)', () => {
  const alle = [
    dossierSubsidie('ISDE', 'voorbereiding'),
    dossierSubsidie('ISDE', 'ingediend'),
    dossierSubsidie('ISDE', 'toegekend'),
    dossierSubsidie('ISDE', 'afgewezen'),
    dossierSubsidie('ISDE', 'verantwoord'),
  ]
  const resultaat = bouwGeraakteDossiers({ regeling: 'ISDE' }, alle)
  assert.equal(resultaat.length, 2)
})

test('bouwGeraakteDossiers: sluit niet-open (afgeronde/gearchiveerde) dossiers uit', () => {
  const alle = [dossierSubsidie('ISDE', 'voorbereiding', 'open'), dossierSubsidie('ISDE', 'voorbereiding', 'afgerond')]
  const resultaat = bouwGeraakteDossiers({ regeling: 'ISDE' }, alle)
  assert.equal(resultaat.length, 1)
})

test('bouwGeraakteDossiers: geen deadline of lege lijst geeft gewoon een lege lijst, nooit een crash', () => {
  assert.deepEqual(bouwGeraakteDossiers(null, [dossierSubsidie('ISDE', 'voorbereiding')]), [])
  assert.deepEqual(bouwGeraakteDossiers({ regeling: 'ISDE' }, []), [])
  assert.deepEqual(bouwGeraakteDossiers({ regeling: 'ISDE' }, undefined), [])
})

test('controleIsVerouderd: precies op de drempel (60 dagen) en erover telt als verouderd, eronder niet', () => {
  const nu = new Date('2026-10-19T00:00:00Z')
  const opDrempel = new Date(nu.getTime() - CONTROLE_DREMPEL_DAGEN * 24 * 60 * 60 * 1000)
  const ietsBinnenDrempel = new Date(nu.getTime() - (CONTROLE_DREMPEL_DAGEN - 1) * 24 * 60 * 60 * 1000)
  assert.equal(controleIsVerouderd(opDrempel.toISOString(), nu), true)
  assert.equal(controleIsVerouderd(ietsBinnenDrempel.toISOString(), nu), false)
})

test('controleIsVerouderd: geen controledatum bekend telt ook als verouderd (nog nooit gecontroleerd)', () => {
  assert.equal(controleIsVerouderd(null), true)
  assert.equal(controleIsVerouderd(undefined), true)
})

test('laatsteControleDatum: neemt de meest recente van alleen de actieve deadlines, negeert uitgezette', () => {
  const deadlines = [
    { gecontroleerd_op: '2026-08-01T00:00:00Z', actief: true },
    { gecontroleerd_op: '2026-10-01T00:00:00Z', actief: true },
    { gecontroleerd_op: '2026-10-15T00:00:00Z', actief: false },
  ]
  assert.equal(laatsteControleDatum(deadlines), '2026-10-01T00:00:00Z')
})

test('laatsteControleDatum: geen (actieve) deadlines geeft null', () => {
  assert.equal(laatsteControleDatum([]), null)
  assert.equal(laatsteControleDatum([{ gecontroleerd_op: '2026-10-01T00:00:00Z', actief: false }]), null)
})
