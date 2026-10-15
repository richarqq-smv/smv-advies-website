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

test('OfferteDocument.jsx: gebruikt het instellingen-prop (factuur_instellingen) voor het titelblok, via bedrijfsgegevens_snapshot met live instellingen als terugvaloptie (verificatieronde 2026-10-15)', () => {
  const bron = leesZonderComments('..', '..', 'components', 'klantOmgeving', 'OfferteDocument.jsx')
  assert.match(bron, /function OfferteDocument\(\{ offerte, instellingen \}\)/)
  assert.match(bron, /const bedrijfsgegevens = offerte\.bedrijfsgegevens_snapshot \?\? instellingen/)
  assert.match(bron, /bedrijfsgegevens\.adres/)
  assert.match(bron, /bedrijfsgegevens\.bedrijfsnaam/)
})

test('OffertePreview.jsx: haalt getFactuurInstellingen() op en geeft het door aan OfferteDocument', () => {
  const bron = leesZonderComments('..', '..', 'pages', 'OffertePreview.jsx')
  assert.match(bron, /getFactuurInstellingen/)
  assert.match(bron, /<OfferteDocument offerte=\{offerte\} instellingen=\{instellingen\} \/>/)
})

test('FactuurDocument.jsx: blijft (zoals voorheen) instellingen gebruiken, niet data/company.js — via bedrijfsgegevens_snapshot met live instellingen als terugvaloptie (verificatieronde 2026-10-15)', () => {
  const bron = leesZonderComments('..', '..', 'components', 'admin', 'FactuurDocument.jsx')
  assert.equal(/from ['"].*data\/company['"]/.test(bron), false)
  assert.match(bron, /const bedrijfsgegevens = factuur\.bedrijfsgegevens_snapshot \?\? instellingen/)
  assert.match(bron, /bedrijfsgegevens\.bedrijfsnaam/)
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

// --- Factuur-/offertesnapshot van bedrijfsgegevens (verificatieronde 2026-10-15, onderdeel B) ---
// Bron: 0049_bedrijfsgegevens_snapshot.sql + api.js + de twee aanroeppunten
// (OfferteEditor.jsx voor createOfferte, OffertesHistorie.jsx voor
// createFactuur). Statische broncontrole, zelfde patroon als hierboven.

test('api.js: createOfferte() en createFactuur() accepteren allebei een bedrijfsgegevensSnapshot-parameter (default null)', () => {
  const bron = leesZonderComments('api.js')
  const aantal = (bron.match(/bedrijfsgegevensSnapshot = null/g) ?? []).length
  assert.equal(aantal, 2, 'verwacht precies twee functies (createOfferte/createFactuur) met dit parameter')
})

test('api.js: createOfferte() en createFactuur() geven bedrijfsgegevensSnapshot allebei door als bedrijfsgegevens_snapshot-kolom', () => {
  const bron = leesZonderComments('api.js')
  const aantal = (bron.match(/bedrijfsgegevens_snapshot: bedrijfsgegevensSnapshot/g) ?? []).length
  assert.equal(aantal, 2, 'verwacht precies twee insert-aanroepen (offertes/facturen) die deze kolom zetten')
})

test('api.js: OFFERTE_KOLOMMEN en FACTUUR_KOLOMMEN selecteren bedrijfsgegevens_snapshot (anders komt de snapshot nooit terug bij het ophalen)', () => {
  const bron = leesZonderComments('api.js')
  assert.match(bron, /const OFFERTE_KOLOMMEN =\s*\n?\s*'[^']*bedrijfsgegevens_snapshot[^']*'/)
  assert.match(bron, /const FACTUUR_KOLOMMEN =\s*\n?\s*'[^']*bedrijfsgegevens_snapshot[^']*'/)
})

test('OfferteEditor.jsx: haalt instellingen op en geeft bouwBedrijfsgegevensSnapshot(instellingen) door aan createOfferte', () => {
  const bron = leesZonderComments('..', '..', 'components', 'klantOmgeving', 'OfferteEditor.jsx')
  assert.match(bron, /getFactuurInstellingen/)
  assert.match(bron, /bedrijfsgegevensSnapshot: bouwBedrijfsgegevensSnapshot\(instellingen\)/)
})

test('OffertesHistorie.jsx: geeft bouwBedrijfsgegevensSnapshot(instellingen) door aan createFactuur (hergebruikt de al opgehaalde instellingen, geen tweede fetch)', () => {
  const bron = leesZonderComments('..', '..', 'components', 'klantOmgeving', 'OffertesHistorie.jsx')
  assert.match(bron, /const instellingen = await getFactuurInstellingen\(\)/)
  assert.match(bron, /bedrijfsgegevensSnapshot: bouwBedrijfsgegevensSnapshot\(instellingen\)/)
})

test('0049_bedrijfsgegevens_snapshot.sql: voegt de nullable kolom toe aan zowel offertes als facturen, met een null-of-object CHECK', () => {
  const migratie = readFileSync(
    path.join(HIER, '..', '..', '..', 'supabase', 'migrations', '0049_bedrijfsgegevens_snapshot.sql'),
    'utf8',
  )
  assert.match(migratie, /alter table public\.offertes\s*\n\s*add column bedrijfsgegevens_snapshot jsonb/)
  assert.match(migratie, /alter table public\.facturen\s*\n\s*add column bedrijfsgegevens_snapshot jsonb/)
  const checkCount = (migratie.match(/bedrijfsgegevens_snapshot is null or jsonb_typeof\(bedrijfsgegevens_snapshot\) = 'object'/g) ?? []).length
  assert.equal(checkCount, 2)
})

test('0049_bedrijfsgegevens_snapshot.sql: beide integriteitstriggers bevriezen de nieuwe kolom null-veilig (IS DISTINCT FROM) tijdens een statusovergang', () => {
  const migratie = readFileSync(
    path.join(HIER, '..', '..', '..', 'supabase', 'migrations', '0049_bedrijfsgegevens_snapshot.sql'),
    'utf8',
  )
  const distinctCount = (migratie.match(/NEW\.bedrijfsgegevens_snapshot is distinct from OLD\.bedrijfsgegevens_snapshot/g) ?? []).length
  assert.equal(distinctCount, 2)
  // Regressiebewaking: de verzonden_op-toekenning uit 0009_offerte_verzonden_op.sql
  // (concept -> verstuurd) moet in bewaak_offerte_integriteit() behouden blijven —
  // deze migratie bouwt op de nieuwste versie van die functie voort, niet op de
  // oorspronkelijke uit 0005_offertes.sql.
  assert.match(migratie, /OLD\.status = 'concept' and NEW\.status = 'verstuurd'[\s\S]*?NEW\.verzonden_op := now\(\);/)
})
