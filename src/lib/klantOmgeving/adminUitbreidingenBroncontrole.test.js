import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Statische bron-controles (zelfde patroon als bedrijfsgegevensBroncontrole.test.js)
 * voor de ronde "E-mail in mobiele admin-nav" + "Dossier naar archief vanaf
 * DossierDetail.jsx" (2026-10-01). Puur-logische archiveer-regels staan al
 * in dossierArchief.test.js — dit bestand controleert alleen de nieuwe
 * bedrading: de juiste link/plek in de navigatie, en dat DossierDetail.jsx
 * de bestaande archiveerDossier()/magDossierArchiveren()-architectuur
 * hergebruikt in plaats van een nieuw mechanisme te introduceren.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function leesZonderComments(...relatievePad) {
  const volledigPad = path.join(HIER, ...relatievePad)
  const bron = readFileSync(volledigPad, 'utf8')
  return bron.replace(/\/\*[\s\S]*?\*\//g, '')
}

// --- E-mail (Porkbun webmail) in de mobiele admin-drawer ---

test('adminNavigation.js: ADMIN_EXTERNE_NAV_ITEMS bevat exact de Porkbun-webmail-link, geen andere URL', () => {
  const bron = leesZonderComments('..', '..', 'data', 'adminNavigation.js')
  assert.match(bron, /export const ADMIN_EXTERNE_NAV_ITEMS = \[\{ href: 'https:\/\/webmail\.porkbun\.com\/\?_task=mail&_mbox=INBOX', label: 'E-mail' \}\]/)
})

test('adminNavigation.js: geen Porkbun API-sleutel, credential of iframe-gerelateerde code toegevoegd', () => {
  const bron = leesZonderComments('..', '..', 'data', 'adminNavigation.js')
  assert.equal(/apikey|api_key|secret|iframe/i.test(bron), false)
})

test('AdminMobileNav.jsx: rendert ADMIN_EXTERNE_NAV_ITEMS direct na ADMIN_ADMINISTRATIE_NAV_ITEMS (dus onder BTW, de laatste administratie-link)', () => {
  const bron = leesZonderComments('..', '..', 'components', 'admin', 'AdminMobileNav.jsx')
  const administratieIndex = bron.indexOf('ADMIN_ADMINISTRATIE_NAV_ITEMS.map')
  const externeIndex = bron.indexOf('ADMIN_EXTERNE_NAV_ITEMS.map')
  assert.ok(administratieIndex > -1, 'ADMIN_ADMINISTRATIE_NAV_ITEMS.map niet gevonden')
  assert.ok(externeIndex > administratieIndex, 'ADMIN_EXTERNE_NAV_ITEMS.map staat niet na ADMIN_ADMINISTRATIE_NAV_ITEMS.map')
})

test('AdminMobileNav.jsx: externe link opent in nieuw tabblad zonder de huidige sessie/tab kwijt te raken (target="_blank" rel="noopener noreferrer"), geen iframe', () => {
  const bron = leesZonderComments('..', '..', 'components', 'admin', 'AdminMobileNav.jsx')
  assert.match(bron, /href=\{item\.href\}/)
  assert.match(bron, /target="_blank"/)
  assert.match(bron, /rel="noopener noreferrer"/)
  assert.equal(/<iframe/i.test(bron), false)
})

test('AdminMobileNav.jsx: geen window.open() nodig — gewone <a> volstaat (zelfde patroon als mailto/tel-links elders)', () => {
  const bron = leesZonderComments('..', '..', 'components', 'admin', 'AdminMobileNav.jsx')
  assert.equal(/window\.open/.test(bron), false)
})

// --- Dossier "Naar archief" op DossierDetail.jsx ---

test('DossierDetail.jsx: hergebruikt de bestaande archiveerDossier()-functie uit api.js, geen eigen delete/update-logica', () => {
  const bron = leesZonderComments('..', '..', 'pages', 'DossierDetail.jsx')
  assert.match(bron, /archiveerDossier/)
  assert.equal(/\.delete\(\)/.test(bron), false)
})

test('DossierDetail.jsx: hergebruikt de bestaande magDossierArchiveren()-guard uit dossierArchief.js', () => {
  const bron = leesZonderComments('..', '..', 'pages', 'DossierDetail.jsx')
  assert.match(bron, /import \{ magDossierArchiveren \} from '\.\.\/lib\/klantOmgeving\/dossierArchief'/)
  assert.match(bron, /magDossierArchiveren\(dossier\)/)
})

test('DossierDetail.jsx: de archiveerknop is admin-only (isAdmin in de conditie)', () => {
  const bron = leesZonderComments('..', '..', 'pages', 'DossierDetail.jsx')
  assert.match(bron, /isAdmin && magDossierArchiveren\(dossier\)/)
})

test('DossierDetail.jsx: toont een bevestiging voordat er wordt gearchiveerd (geen directe archivering op de eerste klik)', () => {
  const bron = leesZonderComments('..', '..', 'pages', 'DossierDetail.jsx')
  assert.match(bron, /setArchiveerBevestiging\(true\)/)
  assert.match(bron, /archiveerBevestiging \?/)
  assert.match(bron, /Ja, naar archief/)
  assert.match(bron, /Annuleren/)
})

test('DossierDetail.jsx: annuleren roept archiveerDossier niet aan (zet alleen archiveerBevestiging terug op false)', () => {
  const bron = leesZonderComments('..', '..', 'pages', 'DossierDetail.jsx')
  assert.match(bron, /onClick=\{\(\) => setArchiveerBevestiging\(false\)\}/)
})

test('DossierDetail.jsx: de bevestigingstekst maakt expliciet duidelijk dat het dossier niet wordt verwijderd en gekoppelde data bewaard blijft', () => {
  const bron = leesZonderComments('..', '..', 'pages', 'DossierDetail.jsx')
  assert.match(bron, /niet verwijderd/)
  assert.match(bron, /offertes, facturen, documenten/)
})

test('DossierDetail.jsx: navigeert na succesvol archiveren naar de bestaande Archief-route (ROUTES.archief), geen nieuwe archiefpagina', () => {
  const bron = leesZonderComments('..', '..', 'pages', 'DossierDetail.jsx')
  assert.match(bron, /navigate\(ROUTES\.archief\)/)
})

test('DossierDetail.jsx: naarArchief() zet alleen gearchiveerd_op via archiveerDossier() — geen aanroep naar andere tabellen (adviespunten/offertes/facturen/documenten/planning/dossier_taken)', () => {
  const bron = leesZonderComments('..', '..', 'pages', 'DossierDetail.jsx')
  const functieMatch = bron.match(/async function naarArchief\(\) \{[\s\S]*?\n  \}/)
  assert.ok(functieMatch, 'naarArchief() functie niet gevonden')
  const functieBody = functieMatch[0]
  assert.match(functieBody, /archiveerDossier\(dossier\.dossier_id\)/)
  assert.equal(/adviespunten|offertes|facturen|documenten|planning|dossier_taken/i.test(functieBody), false)
})
