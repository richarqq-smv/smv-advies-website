import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bouwCsv, bouwDossiersCsv } from './csvExport.js'

test('bouwCsv: header + rijen, CRLF-regeleindes', () => {
  const csv = bouwCsv(
    [
      { header: 'Naam', waarde: (r) => r.naam },
      { header: 'Aantal', waarde: (r) => r.aantal },
    ],
    [{ naam: 'Jan', aantal: 3 }],
  )
  assert.equal(csv, 'Naam,Aantal\r\nJan,3\r\n')
})

test('bouwCsv: escapet velden met komma, aanhalingsteken of newline (RFC4180)', () => {
  const csv = bouwCsv([{ header: 'Tekst', waarde: (r) => r.tekst }], [
    { tekst: 'met, komma' },
    { tekst: 'met "quote"' },
    { tekst: 'met\nnewline' },
  ])
  const regels = csv.split('\r\n')
  assert.equal(regels[1], '"met, komma"')
  assert.equal(regels[2], '"met ""quote"""')
  assert.equal(regels[3], '"met\nnewline"')
})

test('bouwCsv: null/undefined wordt een lege cel, geen "null"-tekst', () => {
  const csv = bouwCsv([{ header: 'X', waarde: (r) => r.x }], [{ x: null }, { x: undefined }])
  assert.equal(csv, 'X\r\n\r\n\r\n')
})

test('bouwDossiersCsv: vaste kolomvolgorde, ontbrekende klant/pand-namen worden lege cellen, geen crash', () => {
  const dossiers = [
    { klanten: { naam: 'Jan Jansen' }, panden: { omschrijving: 'Hoofdkantoor' }, status: 'open', adviespunten: [{ count: 2 }], created_at: '2026-09-01T00:00:00Z' },
    { klanten: null, panden: null, status: 'afgerond', adviespunten: [], created_at: null },
  ]
  const csv = bouwDossiersCsv(dossiers)
  const regels = csv.trim().split('\r\n')
  assert.equal(regels[0], 'Klant,Pand,Status,Aantal adviespunten,Aangemaakt op')
  assert.equal(regels[1], 'Jan Jansen,Hoofdkantoor,open,2,2026-09-01')
  assert.equal(regels[2], ',,afgerond,0,')
})

test('bouwDossiersCsv: lege lijst geeft alleen de header', () => {
  const csv = bouwDossiersCsv([])
  assert.equal(csv, 'Klant,Pand,Status,Aantal adviespunten,Aangemaakt op\r\n')
})
