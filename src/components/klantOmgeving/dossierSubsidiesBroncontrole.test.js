import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Broncontrole voor Subsidiehulp Fase 2 — dossier_subsidies + de twee
 * koppeltabellen (dossier_subsidie_maatregelen/-documenten), het nieuwe
 * DossierSubsidies.jsx-component en de api.js-wrappers. Zelfde methode
 * als dossierTakenKoppelingenBroncontrole.test.js (Fase 1): dit project
 * heeft geen jsdom/React-testrunner, dus statische source-checks in
 * plaats van rendertests. De daadwerkelijke RLS-garantie is al live
 * tegen de echte database geverifieerd (admin/eigen klant/vreemde
 * klant/anon), dit bestand controleert alleen dat de brontekst dat
 * ontwerp ook werkelijk weerspiegelt.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8')
}

const MIGRATIE = lees('..', '..', '..', 'supabase', 'migrations', '0035_dossier_subsidies.sql')
const COMPONENT = lees('DossierSubsidies.jsx')
const API = lees('..', '..', 'lib', 'klantOmgeving', 'api.js')
const DOSSIER_DETAIL = lees('..', '..', 'pages', 'DossierDetail.jsx')

test('migratie 0035: dossier_subsidies heeft de juiste kolommen en check-constraints', () => {
  const tabel = MIGRATIE.match(/create table public\.dossier_subsidies \([\s\S]*?\);/)[0]
  assert.match(tabel, /dossier_id uuid not null references public\.dossiers\(dossier_id\) on delete cascade/)
  assert.match(tabel, /regeling_naam text not null/)
  assert.match(tabel, /status text not null default 'voorbereiding' check \(status in \('voorbereiding', 'ingediend', 'toegekend', 'afgewezen', 'verantwoord'\)\)/)
})

test('migratie 0035: geen FK naar een regelingendatabase — regeling_naam blijft bewust vrije tekst (Fase 4 is nog niet nu)', () => {
  // De toelichting ín de migratie mag best uitleggen waarom er geen
  // subsidie_regelingen is (zie de commentaarregels) — wat hier getest
  // wordt is dat er geen daadwerkelijke tabel/FK naar die naam bestaat.
  assert.equal(/create table public\.subsidie_regelingen/.test(MIGRATIE), false)
  assert.equal(/references public\.subsidie_regelingen/.test(MIGRATIE), false)
})

test('migratie 0035: geen ongebruikte subsidie_id-kolom op dossier_taken toegevoegd (geen alter table dossier_taken)', () => {
  assert.equal(/alter table public\.dossier_taken/.test(MIGRATIE), false)
})

test('migratie 0035: beide koppeltabellen zijn n-op-n met cascade delete en een unique-constraint tegen dubbele koppelingen', () => {
  const maatregelen = MIGRATIE.match(/create table public\.dossier_subsidie_maatregelen \([\s\S]*?\);/)[0]
  assert.match(maatregelen, /subsidie_id uuid not null references public\.dossier_subsidies\(subsidie_id\) on delete cascade/)
  assert.match(maatregelen, /adviespunt_id uuid not null references public\.adviespunten\(adviespunt_id\) on delete cascade/)
  assert.match(maatregelen, /unique \(subsidie_id, adviespunt_id\)/)

  const documenten = MIGRATIE.match(/create table public\.dossier_subsidie_documenten \([\s\S]*?\);/)[0]
  assert.match(documenten, /subsidie_id uuid not null references public\.dossier_subsidies\(subsidie_id\) on delete cascade/)
  assert.match(documenten, /document_id uuid not null references public\.documenten\(document_id\) on delete cascade/)
  assert.match(documenten, /unique \(subsidie_id, document_id\)/)
})

test('migratie 0035: alle 3 tabellen zijn volledig admin-only (RLS), geen klant-select-policy', () => {
  ;['dossier_subsidies', 'dossier_subsidie_maatregelen', 'dossier_subsidie_documenten'].forEach((tabel) => {
    assert.match(MIGRATIE, new RegExp(`alter table public\\.${tabel} enable row level security`))
    assert.match(MIGRATIE, new RegExp(`create policy ${tabel}_select_admin on public\\.${tabel} for select\\s+using \\(public\\.is_admin\\(\\)\\)`))
  })
  assert.equal(/is_member_of_klant/.test(MIGRATIE), false)
})

test('api.js: dossier_subsidies CRUD gebruikt de juiste tabel en kolommen', () => {
  assert.match(API, /export async function listDossierSubsidies\(dossierId\)/)
  assert.match(API, /await supabase\.from\('dossier_subsidies'\)\.select\('\*'\)\.eq\('dossier_id', dossierId\)/)
  assert.match(API, /export async function addDossierSubsidie\(dossierId, \{ regelingNaam, verwachtBedrag = null, status = 'voorbereiding', deadline = null, notitie = null \}\)/)
  assert.match(API, /export async function updateDossierSubsidie\(subsidieId, \{ regelingNaam, verwachtBedrag, status, deadline, notitie \}\)/)
  assert.match(API, /export async function removeDossierSubsidie\(subsidieId\)/)
})

test('api.js: koppelfuncties voor maatregelen/documenten bestaan en gebruiken de juiste koppeltabellen', () => {
  assert.match(API, /export async function listSubsidieMaatregelen\(subsidieId\)/)
  assert.match(API, /await supabase\.from\('dossier_subsidie_maatregelen'\)\.select\('id, adviespunt_id, adviespunten\(\*\)'\)\.eq\('subsidie_id', subsidieId\)/)
  assert.match(API, /export async function koppelSubsidieMaatregel\(subsidieId, adviespuntId\)/)
  assert.match(API, /export async function ontkoppelSubsidieMaatregel\(koppelingId\)/)

  assert.match(API, /export async function listSubsidieDocumenten\(subsidieId\)/)
  assert.match(API, /await supabase\.from\('dossier_subsidie_documenten'\)\.select\('id, document_id, documenten\(\*\)'\)\.eq\('subsidie_id', subsidieId\)/)
  assert.match(API, /export async function koppelSubsidieDocument\(subsidieId, documentId\)/)
  assert.match(API, /export async function ontkoppelSubsidieDocument\(koppelingId\)/)
})

test('DossierSubsidies.jsx: accepteert adviespunten/documenten als props (bestaande, al dossiergebonden lijsten) en is admin-only', () => {
  assert.match(COMPONENT, /export function DossierSubsidies\(\{ dossierId, magBeheren, adviespunten = \[\], documenten = \[\] \}\)/)
  assert.match(COMPONENT, /if \(!magBeheren\) return null/)
})

test('DossierSubsidies.jsx: toont fallback-tekst als er niets gekoppeld is', () => {
  assert.match(COMPONENT, /Geen maatregel gekoppeld/)
  assert.match(COMPONENT, /Geen document gekoppeld/)
})

test('DossierSubsidies.jsx: filtert al-gekoppelde adviespunten/documenten uit de koppel-select (geen dubbele koppeling via de UI)', () => {
  assert.match(COMPONENT, /const gekoppeldeAdviespuntIds = new Set\(maatregelen\.map\(\(m\) => m\.adviespunt_id\)\)/)
  assert.match(COMPONENT, /const beschikbareAdviespunten = adviespunten\.filter\(\(a\) => !gekoppeldeAdviespuntIds\.has\(a\.adviespunt_id\)\)/)
  assert.match(COMPONENT, /const gekoppeldeDocumentIds = new Set\(subsidieDocumenten\.map\(\(d\) => d\.document_id\)\)/)
  assert.match(COMPONENT, /const beschikbareDocumenten = documenten\.filter\(\(d\) => !gekoppeldeDocumentIds\.has\(d\.document_id\)\)/)
})

test('DossierSubsidies.jsx: geen nieuwe upload-input, geen regelingendatabase/matching-UI (scope-grens Fase 2)', () => {
  assert.equal(/type="file"/.test(COMPONENT), false)
  assert.equal(/subsidie_regelingen|\/admin\/subsidies|mogelijk relevant/.test(COMPONENT), false)
})

test('DossierSubsidies.jsx: koppelen/ontkoppelen loopt via de nieuwe api.js-functies', () => {
  const importRegel = COMPONENT.match(/^import \{[\s\S]*?\} from '\.\.\/\.\.\/lib\/klantOmgeving\/api'/m)[0]
  ;['listDossierSubsidies', 'addDossierSubsidie', 'updateDossierSubsidie', 'removeDossierSubsidie', 'koppelSubsidieMaatregel', 'ontkoppelSubsidieMaatregel', 'koppelSubsidieDocument', 'ontkoppelSubsidieDocument'].forEach((fn) => {
    assert.match(importRegel, new RegExp(fn))
  })
})

test('DossierDetail.jsx: nieuwe Subsidies-sectie is Gold-only en admin-only, en DossierTaken blijft ongewijzigd ernaast bestaan (regressie)', () => {
  assert.match(DOSSIER_DETAIL, /isAdmin && dossier\.pakket_id === 'gold' \? \(\s*<Accordion title="Subsidies">\s*<DossierSubsidies/)
  assert.match(DOSSIER_DETAIL, /isAdmin && dossier\.pakket_id === 'gold' \? \(\s*<Accordion title="Subsidiebegeleiding & oplevering">\s*<DossierTaken/)
})

test('DossierDetail.jsx: geeft dezelfde dossiergebonden adviespunten/documentenVoorDossier-lijsten door aan DossierSubsidies als aan DossierTaken', () => {
  const callRegel = DOSSIER_DETAIL.match(/<DossierSubsidies[\s\S]*?\/>/)[0]
  assert.match(callRegel, /adviespunten=\{adviespunten\}/)
  assert.match(callRegel, /documenten=\{documentenVoorDossier\}/)
})
