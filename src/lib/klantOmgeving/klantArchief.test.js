import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isKlantGearchiveerd, magKlantArchiveren, magKlantHerstellen, dossiersDieMeeArchiveren } from './klantArchief.js'

test('isKlantGearchiveerd: true met een gearchiveerd_op-tijdstip', () => {
  assert.equal(isKlantGearchiveerd({ gearchiveerd_op: '2026-10-01T10:00:00.000Z' }), true)
})

test('isKlantGearchiveerd: false zonder gearchiveerd_op (null/undefined/ontbrekend)', () => {
  assert.equal(isKlantGearchiveerd({ gearchiveerd_op: null }), false)
  assert.equal(isKlantGearchiveerd({}), false)
  assert.equal(isKlantGearchiveerd(undefined), false)
})

test('magKlantArchiveren: een niet-gearchiveerde klant mag worden gearchiveerd', () => {
  assert.equal(magKlantArchiveren({ gearchiveerd_op: null }), true)
})

test('magKlantArchiveren: een al gearchiveerde klant mag niet nogmaals worden gearchiveerd', () => {
  assert.equal(magKlantArchiveren({ gearchiveerd_op: '2026-10-01T10:00:00.000Z' }), false)
})

test('magKlantHerstellen: alleen true voor een daadwerkelijk gearchiveerde klant', () => {
  assert.equal(magKlantHerstellen({ gearchiveerd_op: '2026-10-01T10:00:00.000Z' }), true)
  assert.equal(magKlantHerstellen({ gearchiveerd_op: null }), false)
})

test('magKlantArchiveren en magKlantHerstellen sluiten elkaar altijd uit', () => {
  const gearchiveerd = { gearchiveerd_op: '2026-10-01T10:00:00.000Z' }
  const actief = { gearchiveerd_op: null }
  assert.notEqual(magKlantArchiveren(gearchiveerd), magKlantHerstellen(gearchiveerd))
  assert.notEqual(magKlantArchiveren(actief), magKlantHerstellen(actief))
})

test('dossiersDieMeeArchiveren: alleen open, nog niet gearchiveerde dossiers', () => {
  const dossiers = [
    { dossier_id: '1', status: 'open', gearchiveerd_op: null },
    { dossier_id: '2', status: 'open', gearchiveerd_op: '2026-09-01T00:00:00.000Z' }, // al los gearchiveerd
    { dossier_id: '3', status: 'afgerond', gearchiveerd_op: null }, // afgerond = onwijzigbaar, gaat niet mee
    { dossier_id: '4', status: 'open', gearchiveerd_op: null },
  ]
  const resultaat = dossiersDieMeeArchiveren(dossiers)
  assert.deepEqual(resultaat.map((d) => d.dossier_id), ['1', '4'])
})

test('dossiersDieMeeArchiveren: lege/ontbrekende input geeft een lege array, geen crash', () => {
  assert.deepEqual(dossiersDieMeeArchiveren([]), [])
  assert.deepEqual(dossiersDieMeeArchiveren(undefined), [])
  assert.deepEqual(dossiersDieMeeArchiveren(null), [])
})
