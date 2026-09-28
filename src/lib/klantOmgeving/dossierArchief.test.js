import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isDossierGearchiveerd, magDossierArchiveren, magDossierHerstellen } from './dossierArchief.js'

test('isDossierGearchiveerd: true met een gearchiveerd_op-tijdstip', () => {
  assert.equal(isDossierGearchiveerd({ status: 'open', gearchiveerd_op: '2026-09-28T10:00:00.000Z' }), true)
})

test('isDossierGearchiveerd: false zonder gearchiveerd_op (null/undefined/ontbrekend)', () => {
  assert.equal(isDossierGearchiveerd({ status: 'open', gearchiveerd_op: null }), false)
  assert.equal(isDossierGearchiveerd({ status: 'open' }), false)
  assert.equal(isDossierGearchiveerd(undefined), false)
})

test('magDossierArchiveren: een actief, niet-gearchiveerd dossier mag gearchiveerd worden', () => {
  assert.equal(magDossierArchiveren({ status: 'open', gearchiveerd_op: null }), true)
})

test('magDossierArchiveren: een al gearchiveerd dossier mag niet nogmaals worden gearchiveerd', () => {
  assert.equal(magDossierArchiveren({ status: 'open', gearchiveerd_op: '2026-09-28T10:00:00.000Z' }), false)
})

test('magDossierArchiveren: een afgerond dossier mag niet worden gearchiveerd (database blokkeert dit sowieso)', () => {
  assert.equal(magDossierArchiveren({ status: 'afgerond', gearchiveerd_op: null }), false)
})

test('magDossierHerstellen: alleen true voor een daadwerkelijk gearchiveerd dossier', () => {
  assert.equal(magDossierHerstellen({ status: 'open', gearchiveerd_op: '2026-09-28T10:00:00.000Z' }), true)
  assert.equal(magDossierHerstellen({ status: 'open', gearchiveerd_op: null }), false)
})

test('magDossierArchiveren en magDossierHerstellen sluiten elkaar altijd uit', () => {
  const gearchiveerd = { status: 'open', gearchiveerd_op: '2026-09-28T10:00:00.000Z' }
  const actief = { status: 'open', gearchiveerd_op: null }
  assert.notEqual(magDossierArchiveren(gearchiveerd), magDossierHerstellen(gearchiveerd))
  assert.notEqual(magDossierArchiveren(actief), magDossierHerstellen(actief))
})
