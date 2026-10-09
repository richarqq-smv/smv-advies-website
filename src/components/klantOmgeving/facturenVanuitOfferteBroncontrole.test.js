import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * Broncontrole (statische source-grep) voor de UX-auditronde 2026-10-09,
 * feature 2: "Factuur maken" mag alleen vanuit een offerte met status
 * 'verstuurd'/'geaccepteerd'. Zie ook de pure-logicatests in offerte.test.js
 * (magFactuurMakenVanuitOfferte) — dit bestand controleert specifiek de
 * database-handhaving en de UI-bedrading.
 */
const migratie = readFileSync('supabase/migrations/0044_factuur_alleen_vanuit_geldige_offerte.sql', 'utf8')
const offertesHistorieJsx = readFileSync('src/components/klantOmgeving/OffertesHistorie.jsx', 'utf8')

test('0044: trigger bewaak_factuur_offerte_status() draait BEFORE INSERT op facturen (niet alleen UPDATE)', () => {
  assert.match(migratie, /create trigger facturen_bewaak_offerte_status\s*\n\s*before insert on public\.facturen/)
})

test('0044: weigert een niet-toegestane offertestatus met een exception (geen stille no-op)', () => {
  assert.match(migratie, /if v_offerte_status not in \('verstuurd', 'geaccepteerd'\) then/)
  assert.match(migratie, /raise exception/)
})

test('0044: checkt ook dat de gekoppelde offerte daadwerkelijk bestaat (geen facturen op een verwijderd/onbekend offerte_id)', () => {
  assert.match(migratie, /if v_offerte_status is null then/)
})

test('0044: laat een factuur zonder offerte_id (losse/standalone factuur) ongemoeid', () => {
  assert.match(migratie, /if NEW\.offerte_id is not null then/)
})

test('OffertesHistorie.jsx: "Factuur maken"-knop wordt alleen getoond als magFactuurMakenVanuitOfferte(offerte.status) true is', () => {
  assert.match(offertesHistorieJsx, /import \{ getOfferte, getOffertesVoorDossier,/)
  assert.match(offertesHistorieJsx, /magFactuurMakenVanuitOfferte \} from '\.\.\/\.\.\/lib\/klantOmgeving\/offerte'/)
  assert.match(offertesHistorieJsx, /magBeheren && magFactuurMakenVanuitOfferte\(offerte\.status\)/)
})

test('OffertesHistorie.jsx: maakFactuur() haalt de actuele offertestatus opnieuw op (getOfferte) vóórdat de factuur wordt aangemaakt, i.p.v. de al geladen status te vertrouwen', () => {
  const functieStart = offertesHistorieJsx.indexOf('async function maakFactuur(offerte)')
  const functieDeel = offertesHistorieJsx.slice(functieStart, functieStart + 1200)
  assert.match(functieDeel, /const actuele = await getOfferte\(offerte\.id\)/)
  assert.match(functieDeel, /if \(!magFactuurMakenVanuitOfferte\(actuele\.status\)\)/)
  // De createFactuur-aanroep moet de ACTUELE (hernieuwde) offertedata gebruiken, niet de mogelijk-verouderde prop.
  assert.match(functieDeel, /bouwFactuurRegelsVanuitOfferte\(actuele\)/)
})

test('OffertesHistorie.jsx: toont een begrijpelijke, specifieke Nederlandse foutmelding bij een ongeldige status (geen generieke "probeer opnieuw" die niet klopt)', () => {
  assert.match(offertesHistorieJsx, /Een factuur kan alleen worden aangemaakt vanuit een offerte met status "Verstuurd" of "Geaccepteerd"/)
  assert.match(offertesHistorieJsx, /\{factuurMakenFoutBericht \?\? 'Factuur aanmaken is niet gelukt\. Probeer het opnieuw\.'\}/)
})
