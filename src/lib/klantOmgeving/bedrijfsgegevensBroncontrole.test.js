import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Statische bron-controles (zelfde patroon als
 * energieScan/publiekeOutputBroncontrole.test.js) voor de bedrijfsgegevens-
 * bronronde (2026-10-01): OfferteDocument.jsx gebruikte tot nu toe de
 * statische src/data/company.js voor het titelblok, terwijl
 * FactuurDocument.jsx al langer correct `instellingen`
 * (factuur_instellingen, Administratie Instellingen) gebruikt — een
 * wijziging in Administratie Instellingen kwam daardoor niet door in
 * nieuwe offertes. Dit test dat beide documenten dezelfde, centrale bron
 * gebruiken, en (sinds de vervolgronde) dat het Adviesrapport diezelfde
 * bron is gaan gebruiken voor de kleine, relevante set bedrijfsgegevens
 * in de metatabel van de drie .docx-sjablonen.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function leesZonderComments(...relatievePad) {
  const volledigPad = path.join(HIER, ...relatievePad)
  const bron = readFileSync(volledigPad, 'utf8')
  return bron.replace(/\/\*[\s\S]*?\*\//g, '')
}

test('OfferteDocument.jsx: importeert niet langer de statische data/company.js', () => {
  const bron = leesZonderComments('..', '..', 'components', 'klantOmgeving', 'OfferteDocument.jsx')
  assert.equal(/from ['"]\.\.\/\.\.\/data\/company['"]/.test(bron), false)
  assert.equal(/\bCOMPANY\./.test(bron), false)
})

test('OfferteDocument.jsx: gebruikt het instellingen-prop (factuur_instellingen) voor het titelblok', () => {
  const bron = leesZonderComments('..', '..', 'components', 'klantOmgeving', 'OfferteDocument.jsx')
  assert.match(bron, /function OfferteDocument\(\{ offerte, instellingen \}\)/)
  assert.match(bron, /instellingen\.adres/)
  assert.match(bron, /instellingen\.bedrijfsnaam/)
})

test('OffertePreview.jsx: haalt getFactuurInstellingen() op en geeft het door aan OfferteDocument', () => {
  const bron = leesZonderComments('..', '..', 'pages', 'OffertePreview.jsx')
  assert.match(bron, /getFactuurInstellingen/)
  assert.match(bron, /<OfferteDocument offerte=\{offerte\} instellingen=\{instellingen\} \/>/)
})

test('FactuurDocument.jsx: blijft (zoals voorheen) instellingen gebruiken, niet data/company.js', () => {
  const bron = leesZonderComments('..', '..', 'components', 'admin', 'FactuurDocument.jsx')
  assert.equal(/from ['"].*data\/company['"]/.test(bron), false)
  assert.match(bron, /instellingen\.bedrijfsnaam/)
})

test('adviesrapportDocx.js: haalt instellingen niet zelf op (geen Supabase-aanroep/factuur_instellingen-string) — ontvangt het als parameter, geen eigen bedrijfsgegevens-bron', () => {
  const bron = leesZonderComments('adviesrapportDocx.js')
  assert.equal(/from ['"].*data\/company['"]/.test(bron), false)
  assert.equal(/factuur_instellingen/.test(bron), false)
  assert.equal(/getFactuurInstellingen/.test(bron), false)
})

test('adviesrapportDocx.js: METATABEL_LABELS bevat de vier bedrijfsgegevensvelden, en geen financieel-administratieve velden (KvK/btw/IBAN)', () => {
  const bron = leesZonderComments('adviesrapportDocx.js')
  assert.match(bron, /Adviesbureau: 'bedrijfsnaam'/)
  assert.match(bron, /'Adres adviesbureau': 'bedrijfsadres'/)
  assert.match(bron, /'Telefoon adviesbureau': 'bedrijfsTelefoon'/)
  assert.match(bron, /'E-mail adviesbureau': 'bedrijfsEmail'/)
  assert.equal(/kvk|btw|iban|tenaamstelling|betalingsvoorwaarden/i.test(bron), false)
})

test('adviesrapportDocx.js: genereerAdviesrapportDocx en triggerAdviesrapportDocxDownload geven instellingen door aan bouwAdviesrapportData', () => {
  const bron = leesZonderComments('adviesrapportDocx.js')
  assert.match(bron, /bouwAdviesrapportData\(\{ dossier, adviespunten, pakketId, adviseurNaam, datum, subsidieTaken, instellingen \}\)/)
})

test('AdviesrapportGenerator.jsx: haalt getFactuurInstellingen() op en geeft instellingen door aan genereerAdviesrapportDocx — niet data/company.js', () => {
  const bron = leesZonderComments('..', '..', 'components', 'klantOmgeving', 'AdviesrapportGenerator.jsx')
  assert.equal(/from ['"].*data\/company['"]/.test(bron), false)
  assert.match(bron, /getFactuurInstellingen/)
  assert.match(bron, /genereerAdviesrapportDocx\(\{ dossier, adviespunten, pakketId, adviseurNaam: adviseurNaam\.trim\(\) \|\| null, subsidieTaken, instellingen \}\)/)
})
