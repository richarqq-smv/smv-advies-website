import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * Broncontrole (statische source-grep) voor het dossiernummer + de
 * uniforme documentbenoeming (2026-10-12, 0045_dossier_nummer.sql +
 * 0046_dossier_nummer_geen_adminverplichting.sql). Pure-logicatests staan
 * in subsidieDocumentData.test.js/subsidieDocumentDocx.test.js.
 */
const migratie = readFileSync('supabase/migrations/0045_dossier_nummer.sql', 'utf8')
const correctie = readFileSync('supabase/migrations/0046_dossier_nummer_geen_adminverplichting.sql', 'utf8')
const adminDossiersJsx = readFileSync('src/pages/AdminDossiers.jsx', 'utf8')
const dossierDetailJsx = readFileSync('src/pages/DossierDetail.jsx', 'utf8')
const adviesrapportDocx = readFileSync('src/lib/klantOmgeving/adviesrapportDocx.js', 'utf8')
const subsidieDocumentDocx = readFileSync('src/lib/subsidie/subsidieDocumentDocx.js', 'utf8')

test('0045_dossier_nummer.sql: zelfde nummerpatroon als offertes/facturen (doorlopende sequence, SMV-DOS-prefix) + backfill + immutabiliteit', () => {
  assert.match(migratie, /create sequence public\.dossier_nummer_seq/)
  assert.match(migratie, /'SMV-DOS-' \|\| extract\(year from now\(\)\)::text/)
  assert.match(migratie, /alter table public\.dossiers alter column dossier_nummer set default public\.genereer_dossier_nummer\(\)/)
  // Backfill: bestaande dossiers krijgen een nummer op basis van aanmaakdatum.
  assert.match(migratie, /row_number\(\) over \(order by created_at asc\)/)
  // Immutabiliteit: het nummer kan nooit meer wijzigen, ook niet door een admin.
  assert.match(migratie, /if NEW\.dossier_nummer <> OLD\.dossier_nummer then/)
})

test('0045_dossier_nummer.sql: elk document dat aan een dossier hangt krijgt automatisch het dossiernummer als voorvoegsel, idempotent', () => {
  assert.match(migratie, /create trigger documenten_benoem_met_dossiernummer/)
  assert.match(migratie, /before insert on public\.documenten/)
  // Idempotentie: een al-geprefixte bestandsnaam (door de .docx-generators) wordt niet dubbel voorzien van een voorvoegsel.
  assert.match(migratie, /NEW\.bestandsnaam !~ '\^SMV-DOS-'/)
})

test('0046_dossier_nummer_geen_adminverplichting.sql: genereer_dossier_nummer() vereist GEEN is_admin() meer — een gewone klant mag zelf een dossier aanmaken (dossiers_insert-RLS, 0001_init.sql)', () => {
  const functieStart = correctie.indexOf('create or replace function public.genereer_dossier_nummer()')
  const functieDeel = correctie.slice(functieStart)
  assert.doesNotMatch(functieDeel, /is_admin\(\)/)
  assert.doesNotMatch(functieDeel, /raise exception/)
  assert.match(functieDeel, /language sql/)
})

test('AdminDossiers.jsx: het dossiernummer is zichtbaar in de dossierlijst', () => {
  assert.match(adminDossiersJsx, /d\.dossier_nummer/)
})

test('DossierDetail.jsx: het dossiernummer staat in de pagina-header', () => {
  assert.match(dossierDetailJsx, /dossier\?\.dossier_nummer/)
})

test('adviesrapportDocx.js/subsidieDocumentDocx.js: beide bestandsnaam-generators beginnen met het dossiernummer indien bekend', () => {
  assert.match(adviesrapportDocx, /dossier\?\.dossier_nummer/)
  assert.match(subsidieDocumentDocx, /data\?\.meta\?\.dossierNummer/)
})
