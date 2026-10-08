import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Broncontrole voor "Dossier heropenen" (feature-verzoek na de
 * subsidie-afrondingsronde, 2026-10-08): een admin moet een afgerond
 * dossier weer kunnen openen, met dubbele bevestiging in de UI. Statische
 * source-checks (zelfde methode als de andere *Broncontrole.test.js-
 * bestanden in dit project — geen jsdom/React-testrunner beschikbaar).
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8')
}

const DOSSIER_DETAIL = lees('DossierDetail.jsx')
const VOLGENDE_STAP = lees('..', 'components', 'klantOmgeving', 'DossierVolgendeStap.jsx')
const API = lees('..', 'lib', 'klantOmgeving', 'api.js')
const MIGRATIE = lees('..', '..', 'supabase', 'migrations', '0041_dossier_heropenen.sql')

test('api.js: heropenDossier() zet uitsluitend status terug naar open, met een guard op de huidige status (zelfde patroon als archiveerDossier)', () => {
  const functieMatch = API.match(/export async function heropenDossier\([\s\S]*?\n\}/)
  assert.ok(functieMatch, 'heropenDossier() niet gevonden in api.js')
  const body = functieMatch[0]
  assert.match(body, /\.update\(\{ status: 'open' \}\)/)
  assert.match(body, /\.eq\('status', 'afgerond'\)/)
})

test('DossierVolgendeStap.jsx: toont de heropenen-knop uitsluitend bij een afgerond dossier én magBeheren', () => {
  assert.match(VOLGENDE_STAP, /afgerond && magBeheren/)
  assert.match(VOLGENDE_STAP, /onClick=\{onHeropenenClick\}/)
})

test('DossierDetail.jsx: hergebruikt de bestaande heropenDossier()-functie uit api.js, geen eigen update-logica', () => {
  assert.match(DOSSIER_DETAIL, /import \{[\s\S]*?heropenDossier[\s\S]*?\} from '\.\.\/lib\/klantOmgeving\/api'/)
  assert.match(DOSSIER_DETAIL, /await heropenDossier\(dossier\.dossier_id\)/)
})

test('DossierDetail.jsx: geeft magBeheren={isAdmin} door aan DossierVolgendeStap — niet-admins kunnen de knop dus nooit zien', () => {
  assert.match(DOSSIER_DETAIL, /magBeheren=\{isAdmin\}/)
})

test('DossierDetail.jsx: heropenen vereist dubbele bevestiging — de knop zet alleen een bevestigingsstaat, dossierHeropenen() wordt pas aangeroepen vanuit de bevestigingsknop', () => {
  assert.match(DOSSIER_DETAIL, /onHeropenenClick=\{\(\) => setHeropenBevestiging\(true\)\}/)
  const bevestigingsBlokMatch = DOSSIER_DETAIL.match(/\{heropenBevestiging \? \([\s\S]*?\) : null\}/)
  assert.ok(bevestigingsBlokMatch, 'bevestigingsblok niet gevonden')
  assert.match(bevestigingsBlokMatch[0], /onClick=\{dossierHeropenen\}/)
  assert.match(bevestigingsBlokMatch[0], /onClick=\{\(\) => setHeropenBevestiging\(false\)\}/)
})

test('DossierDetail.jsx: annuleren roept heropenDossier niet aan (zet alleen heropenBevestiging terug op false)', () => {
  assert.match(DOSSIER_DETAIL, /onClick=\{\(\) => setHeropenBevestiging\(false\)\}/)
})

test('0041_dossier_heropenen.sql: een niet-admin blijft volledig geblokkeerd op een afgerond dossier (geen uitzondering)', () => {
  assert.match(MIGRATIE, /if not public\.is_admin\(\) then\s*\n\s*raise exception 'Een afgerond Dossier kan niet meer worden gewijzigd\.'/)
})

test('0041_dossier_heropenen.sql: een admin mag bij een afgerond dossier alleen de status terugzetten naar open — elke andere kolomwijziging blijft geblokkeerd', () => {
  assert.match(MIGRATIE, /NEW\.status <> 'open'/)
  assert.match(MIGRATIE, /Een afgerond Dossier kan uitsluitend worden heropend/)
})
