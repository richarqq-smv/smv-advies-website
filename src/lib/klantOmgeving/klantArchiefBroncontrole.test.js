import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Statische bron-controles (zelfde patroon als adminUitbreidingenBroncontrole.test.js)
 * voor "klant naar archief" (2026-10-01): expliciete productbeslissing is
 * dat een klant archiveren ook al zijn actieve dossiers meearchiveert
 * (0031_klant_archief.sql). Puur-logische guard-regels staan al in
 * klantArchief.test.js — dit bestand controleert de bedrading: de juiste
 * volgorde/aanroepen in api.js, de juiste plek/bevestiging in
 * AdminDossiers.jsx, en de juiste herstelweg in Archief.jsx.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function leesZonderComments(...relatievePad) {
  const volledigPad = path.join(HIER, ...relatievePad)
  const bron = readFileSync(volledigPad, 'utf8')
  return bron.replace(/\/\*[\s\S]*?\*\//g, '')
}

// --- api.js ---

test('api.js: archiveerKlant() update eerst de dossiers-cascade, dan pas de klant (nooit andersom)', () => {
  const bron = leesZonderComments('api.js')
  const functieMatch = bron.match(/export async function archiveerKlant\(klantId\) \{[\s\S]*?\n\}/)
  assert.ok(functieMatch, 'archiveerKlant() niet gevonden')
  const body = functieMatch[0]
  const dossiersIndex = body.indexOf(".from('dossiers')")
  const klantenIndex = body.indexOf(".from('klanten')")
  assert.ok(dossiersIndex > -1 && klantenIndex > -1, 'beide from()-aanroepen niet gevonden')
  assert.ok(dossiersIndex < klantenIndex, 'dossiers-cascade moet vóór de klant-update komen')
})

test('api.js: archiveerKlant() cascadeert alleen open, nog niet gearchiveerde dossiers, en zet gearchiveerd_via_klant', () => {
  const bron = leesZonderComments('api.js')
  const functieMatch = bron.match(/export async function archiveerKlant\(klantId\) \{[\s\S]*?\n\}/)
  const body = functieMatch[0]
  assert.match(body, /gearchiveerd_via_klant: true/)
  assert.match(body, /\.eq\('status', 'open'\)/)
  assert.match(body, /\.is\('gearchiveerd_op', null\)/)
})

test('api.js: herstelKlant() herstelt uitsluitend dossiers met gearchiveerd_via_klant=true, nooit alle dossiers van de klant', () => {
  const bron = leesZonderComments('api.js')
  const functieMatch = bron.match(/export async function herstelKlant\(klantId\) \{[\s\S]*?\n\}/)
  assert.ok(functieMatch, 'herstelKlant() niet gevonden')
  const body = functieMatch[0]
  assert.match(body, /\.eq\('gearchiveerd_via_klant', true\)/)
  assert.match(body, /gearchiveerd_via_klant: false/)
})

test('api.js: geen enkele archiveer/herstel-functie raakt andere tabellen (adviespunten/offertes/facturen/documenten/planning/dossier_taken)', () => {
  const bron = leesZonderComments('api.js')
  for (const naam of ['archiveerKlant', 'herstelKlant']) {
    const functieMatch = bron.match(new RegExp(`export async function ${naam}\\(klantId\\) \\{[\\s\\S]*?\\n\\}`))
    assert.ok(functieMatch, `${naam}() niet gevonden`)
    assert.equal(/adviespunten|offertes|facturen|documenten|planning_afspraken|dossier_taken/i.test(functieMatch[0]), false, `${naam}() raakt een tabel die het niet zou mogen raken`)
  }
})

test('api.js: adminListKlanten() toont alleen actieve klanten (gearchiveerd_op is null)', () => {
  const bron = leesZonderComments('api.js')
  const functieMatch = bron.match(/export async function adminListKlanten\(\) \{[\s\S]*?\n\}/)
  assert.ok(functieMatch)
  assert.match(functieMatch[0], /\.is\('gearchiveerd_op', null\)/)
})

test('api.js: adminListGearchiveerdeKlanten() is het spiegelbeeld (not gearchiveerd_op is null)', () => {
  const bron = leesZonderComments('api.js')
  const functieMatch = bron.match(/export async function adminListGearchiveerdeKlanten\(\) \{[\s\S]*?\n\}/)
  assert.ok(functieMatch)
  assert.match(functieMatch[0], /\.not\('gearchiveerd_op', 'is', null\)/)
})

// --- AdminDossiers.jsx ---

test('AdminDossiers.jsx: toont de archiveerknop alleen wanneer magKlantArchiveren(k) true is', () => {
  const bron = leesZonderComments('..', '..', 'pages', 'AdminDossiers.jsx')
  assert.match(bron, /magKlantArchiveren\(k\)/)
})

test('AdminDossiers.jsx: toont een bevestiging voordat een klant wordt gearchiveerd, annuleren roept archiveerKlant niet aan', () => {
  const bron = leesZonderComments('..', '..', 'pages', 'AdminDossiers.jsx')
  assert.match(bron, /setArchiveerKlantId\(k\.klant_id\)/)
  assert.match(bron, /archiveerKlantId === k\.klant_id/)
  assert.match(bron, /Ja, naar archief/)
  assert.match(bron, /onClick=\{\(\) => setArchiveerKlantId\(null\)\}/)
})

test('AdminDossiers.jsx: bevestigingstekst maakt duidelijk dat de klant niet definitief verwijderd wordt en meegearchiveerde dossiers genoemd worden', () => {
  const bron = leesZonderComments('..', '..', 'pages', 'AdminDossiers.jsx')
  assert.match(bron, /niet definitief verwijderd/)
  assert.match(bron, /dossiersDieMeeArchiveren/)
})

test('AdminDossiers.jsx: bevestigKlantArchiveren() hergebruikt archiveerKlant() uit api.js, geen eigen delete-logica', () => {
  const bron = leesZonderComments('..', '..', 'pages', 'AdminDossiers.jsx')
  const functieMatch = bron.match(/async function bevestigKlantArchiveren\(klantId\) \{[\s\S]*?\n  \}/)
  assert.ok(functieMatch, 'bevestigKlantArchiveren() niet gevonden')
  assert.match(functieMatch[0], /archiveerKlant\(klantId\)/)
  assert.equal(/\.delete\(\)/.test(functieMatch[0]), false)
})

// --- Archief.jsx ---

test('Archief.jsx: laadt zowel gearchiveerde dossiers als gearchiveerde klanten', () => {
  const bron = leesZonderComments('..', '..', 'pages', 'Archief.jsx')
  assert.match(bron, /adminListGearchiveerdeDossiers/)
  assert.match(bron, /adminListGearchiveerdeKlanten/)
})

test('Archief.jsx: klant herstellen roept herstelKlant() aan, geen eigen restore-logica', () => {
  const bron = leesZonderComments('..', '..', 'pages', 'Archief.jsx')
  const functieMatch = bron.match(/async function bevestigKlantHerstellen\(klantId\) \{[\s\S]*?\n  \}/)
  assert.ok(functieMatch, 'bevestigKlantHerstellen() niet gevonden')
  assert.match(functieMatch[0], /herstelKlant\(klantId\)/)
})
