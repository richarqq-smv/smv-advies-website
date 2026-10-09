import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Broncontrole voor de adminbreedte-ronde (2026-10-09, opdracht deel 9):
 * de admin-werkruimte moet merkbaar breder zijn dan de publieke 1200px-
 * kolom, zonder de gedeelde <Container>/publieke pagina's of de klant-
 * omgeving te raken. Statische source-checks (zelfde methode als de
 * andere *Broncontrole.test.js-bestanden in dit project).
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8')
}

const CONTAINER = lees('Container.jsx')

test('Container.jsx: wide is een opt-in prop (default false) — bestaande publieke pagina-aanroepen zonder wide blijven ongewijzigd', () => {
  assert.match(CONTAINER, /wide = false/)
  assert.match(CONTAINER, /max-w-\[1200px\]/)
  assert.match(CONTAINER, /max-w-\[1800px\]/)
})

const ADMIN_PAGINAS_MET_WIDE = [
  'Admin.jsx',
  'AdminAdministratie.jsx',
  'AdminBtw.jsx',
  'AdminDossiers.jsx',
  'AdminFacturen.jsx',
  'AdminInstellingen.jsx',
  'AdminKansen.jsx',
  'AdminKosten.jsx',
  'AdminOffertes.jsx',
  'AdminOmzet.jsx',
  'AdminOpenstaand.jsx',
  'AdminPlanning.jsx',
  'AdminResultaat.jsx',
  'AdminSubsidieBegeleiding.jsx',
  'AdminSubsidies.jsx',
]

ADMIN_PAGINAS_MET_WIDE.forEach((bestand) => {
  test(`${bestand}: gebruikt <Container wide>, geen smalle max-w-override meer`, () => {
    const bron = lees('..', '..', 'pages', bestand)
    assert.match(bron, /<Container wide>/, `${bestand} gebruikt geen <Container wide>`)
    assert.equal(/<Container className="max-w-\dxl"/.test(bron), false, `${bestand} heeft nog een smalle max-w-override naast/i.p.v. wide`)
  })
})

// Gedeelde pagina's (admin ÉN klant bereiken dezelfde component) mogen NIET
// breder worden — dat zou ook de klantomgeving raken, wat opdracht §9 niet
// vraagt ("wijzig de specifieke pagina" i.p.v. een brede layoutwijziging).
const GEDEELDE_PAGINAS_ZONDER_WIDE = ['DossierDetail.jsx', 'FactuurDetail.jsx']

GEDEELDE_PAGINAS_ZONDER_WIDE.forEach((bestand) => {
  test(`${bestand}: blijft op de standaard (smalle) Container — gedeeld met de klantomgeving, dus geen wide`, () => {
    const bron = lees('..', '..', 'pages', bestand)
    assert.equal(/<Container[^>]*\bwide\b/.test(bron), false, `${bestand} gebruikt onverwacht wide, maar is gedeeld met de klantomgeving`)
  })
})

test('geen enkele publieke (niet-admin) pagina gebruikt per ongeluk wide', () => {
  const pagesDir = path.join(HIER, '..', '..', 'pages')
  const publiekeBestanden = readdirSync(pagesDir).filter(
    (f) => f.endsWith('.jsx') && !f.startsWith('Admin') && !f.endsWith('.test.jsx') && !GEDEELDE_PAGINAS_ZONDER_WIDE.includes(f),
  )
  publiekeBestanden.forEach((bestand) => {
    const bron = lees('..', '..', 'pages', bestand)
    assert.equal(/<Container[^>]*\bwide\b/.test(bron), false, `${bestand} gebruikt onverwacht wide`)
  })
})
