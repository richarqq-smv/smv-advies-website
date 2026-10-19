import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Adviseursronde (2026-10-19): de SMV Duurzaamheidsbadge (Fase 3, #11) kon
 * tot nu toe uitsluitend door de klant zelf, vanuit het eigen account,
 * gedownload worden. Een adviseur wilde 'm ook namens een klant kunnen
 * downloaden, vanuit de Facturen-sectie op de admin-dossierpagina.
 * Statische broncontrole (zelfde methode als de andere *Broncontrole.test.js-
 * bestanden in dit project — geen jsdom/React-testrunner beschikbaar).
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))
const DOSSIER_DETAIL = readFileSync(path.join(HIER, 'DossierDetail.jsx'), 'utf8')

test('AdminBadgeDownload wordt uitsluitend getoond als isAdmin én badgeTotalen bekend zijn — nooit voor de klant zelf', () => {
  assert.match(DOSSIER_DETAIL, /isAdmin && badgeTotalen \? <AdminBadgeDownload totalen=\{badgeTotalen\} bedrijfsnaam=\{bedrijfsnaam\} \/> : null/)
})

test('badgeTotalen wordt alleen opgehaald als isAdmin — een klantsessie triggert dit effect nooit', () => {
  const effectMatch = DOSSIER_DETAIL.match(/useEffect\(\(\) => \{\s*if \(!isAdmin \|\| !dossier\?\.klant_id\) return[\s\S]*?\}, \[isAdmin, dossier\?\.klant_id\]\)/)
  assert.ok(effectMatch, 'badgeTotalen-effect niet gevonden')
})

test('badgeTotalen gebruikt bouwKlantTotalen() over ALLE dossiers van de klant (listDossiersVoorKlant), niet alleen dit ene dossier', () => {
  assert.match(DOSSIER_DETAIL, /import \{ bouwKlantTotalen \} from '\.\.\/lib\/klantOmgeving\/klantTotalen'/)
  assert.match(DOSSIER_DETAIL, /listDossiersVoorKlant\(dossier\.klant_id\)\s*\n\s*\.then\(\(dossiers\) => actief && setBadgeTotalen\(bouwKlantTotalen\(dossiers\)\)\)/)
})

test('AdminBadgeDownload hergebruikt dezelfde genereerBadgePng() als het klantaccount — geen eigen, tweede badge-implementatie', () => {
  assert.match(DOSSIER_DETAIL, /import \{ genereerBadgePng \} from '\.\.\/lib\/klantOmgeving\/badgeCanvas'/)
  const functieMatch = DOSSIER_DETAIL.match(/function AdminBadgeDownload\([\s\S]*?\n\}/)
  assert.ok(functieMatch, 'AdminBadgeDownload niet gevonden')
  assert.match(functieMatch[0], /await genereerBadgePng\(totalen, \{ bedrijfsnaam \}\)/)
})

test('een leesfout bij het ophalen van badgeTotalen blokkeert nooit de rest van de dossierpagina (stille catch, zelfde patroon als het benchmark-effect)', () => {
  const effectMatch = DOSSIER_DETAIL.match(/listDossiersVoorKlant\(dossier\.klant_id\)[\s\S]*?\.catch\(\(\) => \{\}\)/)
  assert.ok(effectMatch, 'geen stille catch gevonden op het badgeTotalen-effect')
})
