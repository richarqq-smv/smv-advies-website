import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Broncontrole voor Subsidiehulp Fase 1 — dossier_taken.adviespunt_id en
 * dossier_taken.document_id bruikbaar maken in DossierTaken.jsx. Dit
 * project heeft geen jsdom/React-testrunner (package.json "test" draait
 * puur `node --test` op .test.js), dus deze test controleert — net als
 * telefonischeAfspraakReviewK2K3BroncontroleTest.test.js dat al voor SQL
 * doet — statisch op de brontekst van de componenten/API, in plaats van
 * te renderen.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8')
}

const COMPONENT = lees('DossierTaken.jsx')
const API = lees('..', '..', 'lib', 'klantOmgeving', 'api.js')
const DOSSIER_DETAIL = lees('..', '..', 'pages', 'DossierDetail.jsx')

test('DossierTaken.jsx: accepteert adviespunten/documenten als props (bestaande, al dossiergebonden lijsten)', () => {
  assert.match(COMPONENT, /export function DossierTaken\(\{ dossierId, pakketId, magBeheren, adviespunten = \[\], documenten = \[\] \}\)/)
})

test('DossierTaken.jsx: toont "Geen maatregel gekoppeld" / "Geen document gekoppeld" als fallback', () => {
  assert.match(COMPONENT, /Geen maatregel gekoppeld/)
  assert.match(COMPONENT, /Geen document gekoppeld/)
})

test('DossierTaken.jsx: maatregel-select gebruikt taak.adviespunt_id als waarde en adviespunten-lijst als opties', () => {
  assert.match(COMPONENT, /value=\{taak\.adviespunt_id \?\? ''\}/)
  assert.match(COMPONENT, /adviespunten\.map\(\(a\) => \(/)
  assert.match(COMPONENT, /\{a\.onderwerp\}/)
})

test('DossierTaken.jsx: document-select gebruikt taak.document_id als waarde en documenten-lijst als opties', () => {
  assert.match(COMPONENT, /value=\{taak\.document_id \?\? ''\}/)
  assert.match(COMPONENT, /documenten\.map\(\(d\) => \(/)
  assert.match(COMPONENT, /\{d\.bestandsnaam\}/)
})

test('DossierTaken.jsx: "Geen" selecteren stuurt null (ontkoppelen), geen leeg-string-waarde naar de API', () => {
  assert.match(COMPONENT, /wijzigAdviespunt\(taak\.taak_id, e\.target\.value \|\| null\)/)
  assert.match(COMPONENT, /wijzigDocument\(taak\.taak_id, e\.target\.value \|\| null\)/)
})

test('DossierTaken.jsx: koppelen/wijzigen/ontkoppelen loopt via de bestaande updateDossierTaak-functie, geen nieuwe API-aanroep', () => {
  const importRegel = COMPONENT.match(/^import \{[^}]*\} from '\.\.\/\.\.\/lib\/klantOmgeving\/api'/m)[0]
  assert.match(importRegel, /updateDossierTaak/)
  assert.match(COMPONENT, /async function wijzigAdviespunt\(taakId, adviespuntId\) \{/)
  assert.match(COMPONENT, /await updateDossierTaak\(taakId, \{ adviespuntId \}\)/)
  assert.match(COMPONENT, /async function wijzigDocument\(taakId, documentId\) \{/)
  assert.match(COMPONENT, /await updateDossierTaak\(taakId, \{ documentId \}\)/)
})

test('DossierTaken.jsx: geen nieuwe upload-input of nieuwe tabel/entiteit toegevoegd (scope-grens Fase 1)', () => {
  assert.equal(/type="file"/.test(COMPONENT), false)
  assert.equal(/dossier_subsidies|subsidie_regelingen|\/admin\/subsidies/.test(COMPONENT), false)
})

test('DossierTaken.jsx: bestaande status-select en verwijderknop blijven onveranderd aanwezig (regressie)', () => {
  assert.match(COMPONENT, /value=\{taak\.status\} onChange=\{\(e\) => wijzigStatus\(taak\.taak_id, e\.target\.value\)\}/)
  assert.match(COMPONENT, /aria-label="Taak verwijderen"/)
})

test('api.js: updateDossierTaak accepteert nu ook adviespuntId en zet die om naar adviespunt_id', () => {
  const fnBody = API.match(/export async function updateDossierTaak\([\s\S]*?\n\}/)[0]
  assert.match(fnBody, /adviespuntId/)
  assert.match(fnBody, /if \(adviespuntId !== undefined\) changes\.adviespunt_id = adviespuntId/)
  // Bestaande documentId-afhandeling blijft ongewijzigd aanwezig (regressie).
  assert.match(fnBody, /if \(documentId !== undefined\) changes\.document_id = documentId/)
})

test('api.js: updateDossierTaak gebruikt nog steeds dezelfde tabel en select-grens als voorheen (geen nieuwe RPC)', () => {
  const fnBody = API.match(/export async function updateDossierTaak\([\s\S]*?\n\}/)[0]
  assert.match(fnBody, /supabase\.from\('dossier_taken'\)\.update\(changes\)\.eq\('taak_id', taakId\)/)
})

test('DossierDetail.jsx: geeft de al dossiergebonden adviespunten/documentenVoorDossier-lijsten door aan DossierTaken (dossierisolatie via bestaande server-side filtering, geen losse client-side filterlaag nodig)', () => {
  const callRegel = DOSSIER_DETAIL.match(/<DossierTaken[\s\S]*?\/>/)[0]
  assert.match(callRegel, /adviespunten=\{adviespunten\}/)
  assert.match(callRegel, /documenten=\{documentenVoorDossier\}/)
  // adviespunten komt uit listAdviespunten(dossierId) en documentenVoorDossier
  // uit getDocumentenVoorDossier(dossierId) — beide al op dossier_id gefilterd,
  // dus de select-opties kunnen nooit een ander dossier bevatten.
  assert.match(DOSSIER_DETAIL, /listAdviespunten\(dossierId\)/)
  assert.match(DOSSIER_DETAIL, /getDocumentenVoorDossier\(dossierId\)/)
})

test('DossierDetail.jsx: Gold-only gating van de Subsidiebegeleiding-sectie blijft ongewijzigd (regressie)', () => {
  assert.match(DOSSIER_DETAIL, /isAdmin && dossier\.pakket_id === 'gold' \? \(\s*<Accordion title="Subsidiebegeleiding & oplevering">/)
})
