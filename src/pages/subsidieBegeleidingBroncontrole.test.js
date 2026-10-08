import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Broncontrole voor de subsidiebegeleidingsronde (2026-10-xx) — zelfde
 * methode als elders in dit project (geen jsdom/React-testrunner, zie
 * dossierSubsidiesBroncontrole.test.js): statische source-checks dat de
 * knop, route en RLS daadwerkelijk bestaan zoals de opdracht vereist. De
 * daadwerkelijke RLS is al live tegen de database geverifieerd
 * (admin-only op alle 4 operaties, zie het eindrapport van deze ronde).
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8')
}

const DOSSIER_DETAIL = lees('DossierDetail.jsx')
const APP = lees('..', 'App.jsx')
const MIGRATIE = lees('..', '..', 'supabase', 'migrations', '0038_dossier_subsidie_specificaties.sql')
const API = lees('..', 'lib', 'klantOmgeving', 'api.js')

test('DossierDetail.jsx: toont een "Subsidie aanvraag"-knop die naar adminSubsidieBegeleiding linkt, geplaatst tussen Rapport genereren en de Subsidies-accordion', () => {
  const rapportIndex = DOSSIER_DETAIL.indexOf('id="rapport-sectie"')
  const knopIndex = DOSSIER_DETAIL.indexOf('Subsidie aanvraag')
  const subsidiesAccordionIndex = DOSSIER_DETAIL.indexOf('<Accordion title="Subsidies"')
  assert.ok(rapportIndex > -1 && knopIndex > -1 && subsidiesAccordionIndex > -1)
  assert.ok(rapportIndex < knopIndex && knopIndex < subsidiesAccordionIndex)
  assert.match(DOSSIER_DETAIL, /ROUTES\.adminSubsidieBegeleiding\(dossier\.dossier_id\)/)
})

test('App.jsx: de subsidiebegeleidingsroute staat binnen de RequireAuth -> RequireAdmin -> AdminLayout-boom, niet daarbuiten', () => {
  const adminBoomStart = APP.indexOf('<Route element={<RequireAdmin />}>')
  const adminBoomEind = APP.indexOf('</Route>', APP.indexOf('adminInstellingen'))
  const adminBoom = APP.slice(adminBoomStart, adminBoomEind)
  assert.match(adminBoom, /\/admin\/dossiers\/:dossierId\/subsidie/)
})

test('0038_dossier_subsidie_specificaties.sql: volledig admin-only (RLS), geen klant-select-policy, geen pakketcheck', () => {
  assert.match(MIGRATIE, /alter table public\.dossier_subsidie_specificaties enable row level security/)
  const policies = MIGRATIE.match(/create policy [\s\S]*?;/g) ?? []
  assert.equal(policies.length, 4)
  policies.forEach((policy) => {
    assert.match(policy, /is_admin\(\)/)
    assert.equal(/pakket/i.test(policy), false)
    assert.equal(/is_member_of_klant/.test(policy), false)
  })
})

test('0038: unique-constraint op (dossier_id, maatregel_key) — maximaal één specificatierij per maatregel per dossier', () => {
  assert.match(MIGRATIE, /unique \(dossier_id, maatregel_key\)/)
})

test('api.js: upsertDossierSubsidieSpecificatie gebruikt upsert met de juiste onConflict-target (geen losse insert/update die de unique-constraint kan schenden)', () => {
  const functieMatch = API.match(/export async function upsertDossierSubsidieSpecificatie\([\s\S]*?\n\}/)[0]
  assert.match(functieMatch, /\.upsert\(/)
  assert.match(functieMatch, /onConflict: 'dossier_id,maatregel_key'/)
})
