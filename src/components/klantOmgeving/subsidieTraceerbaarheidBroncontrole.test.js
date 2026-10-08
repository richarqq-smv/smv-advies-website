import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Broncontrole voor de traceerbaarheidsronde (2026-10-09) — "bron/maatregel
 * → RVO-regeling → waarom gematcht → beoordeling → subsidietraject →
 * status → opvolging". Vult subsidieCheck.test.js aan (pure logica) met
 * statische checks op de React-integratie, de koppeling aan de AL
 * BESTAANDE dossier_subsidie_maatregelen-tabel en het ontbreken van een
 * nieuwe migratie/tabel — zelfde methode als de andere *Broncontrole.test.js-
 * bestanden in dit project (geen jsdom/React-testrunner beschikbaar).
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8')
}

const SUBSIDIE_CHECK = lees('SubsidieCheck.jsx')
const SUBSIDIE_CHECK_LOGICA = lees('..', '..', 'lib', 'dossier', 'subsidieCheck.js')

test('SubsidieCheck.jsx: toont de officiële RVO-bron (item.url) als link bij elke regeling, ongewijzigd t.o.v. vóór de traceerbaarheidsronde', () => {
  assert.match(SUBSIDIE_CHECK, /href=\{item\.url \? `\$\{RVO_BASIS_URL\}\$\{item\.url\}` : RVO_BASIS_URL\}/)
})

test('SubsidieCheck.jsx: toont per regeling de concrete aanleiding (matchendeSignalen) en een feitelijke waarom-uitleg, niet alleen een statusbadge', () => {
  assert.match(SUBSIDIE_CHECK, /const aanleidingen = /)
  assert.match(SUBSIDIE_CHECK, /function waaromTekst\(signaal\)/)
  // De uitleg citeert letterlijk het gebruikte signaal/de bron, verzint geen nieuwe reden.
  assert.match(SUBSIDIE_CHECK, /bevat "\$\{signaal\.tekst\}"/)
})

test('SubsidieCheck.jsx: "Toevoegen als subsidietraject" gebruikt nog steeds uitsluitend de bestaande addDossierSubsidie() — geen tweede opslagpad', () => {
  const functieMatch = SUBSIDIE_CHECK.match(/async function toevoegenAlsTraject\([\s\S]*?\n  \}/)
  assert.ok(functieMatch, 'toevoegenAlsTraject() niet gevonden')
  assert.match(functieMatch[0], /await addDossierSubsidie\(dossierId, \{ regelingNaam: item\.titel \}\)/)
})

test('SubsidieCheck.jsx: koppelt de aanleiding alleen aan een adviespunt via de AL BESTAANDE koppelSubsidieMaatregel() (dossier_subsidie_maatregelen) — geen nieuwe koppelfunctie, geen nieuwe tabel', () => {
  assert.match(SUBSIDIE_CHECK, /import \{ adminListRvoSubsidieIndex, addDossierSubsidie, koppelSubsidieMaatregel \} from '\.\.\/\.\.\/lib\/klantOmgeving\/api'/)
  const functieMatch = SUBSIDIE_CHECK.match(/async function toevoegenAlsTraject\([\s\S]*?\n  \}/)[0]
  assert.match(functieMatch, /koppelSubsidieMaatregel\(nieuw\.subsidie_id, gevondenAdviespunt\.adviespunt_id\)/)
})

test('SubsidieCheck.jsx: koppelt NOOIT automatisch als er geen overeenkomend adviespunt is gevonden — geen fictieve koppeling (if-guard rond gevondenAdviespunt)', () => {
  const functieMatch = SUBSIDIE_CHECK.match(/async function toevoegenAlsTraject\([\s\S]*?\n  \}/)[0]
  assert.match(functieMatch, /if \(gevondenAdviespunt\) \{/)
  // koppeling blijft null (dus géén koppelSubsidieMaatregel-aanroep) buiten die guard.
  assert.match(functieMatch, /let koppeling = null/)
})

test('subsidieCheck.js: vindGekoppeldAdviespunt() matcht MJOP uitsluitend op componentId (bouwdeelniveau) — het bevroren MJOP-signaal bevat geen measureId om specifieker op te matchen', () => {
  const functieMatch = SUBSIDIE_CHECK_LOGICA.match(/export function vindGekoppeldAdviespunt\([\s\S]*?\n\}/)[0]
  assert.match(functieMatch, /a\.signaal_bevroren\.componentId === signaal\.bron\.componentId/)
  // De functiebody zelf matcht nooit op measureId (dat veld bestaat niet in signaal_bevroren — zie SIGNAAL_BEVROREN_FIELDS in adviespunt.js).
  assert.equal(/measureId/.test(functieMatch), false)
})

test('subsidieCheck.js: vindGekoppeldAdviespunt() matcht Energie exact op het bevroren maatregelNaam (stabiele identiteit, zie energieInsights.js)', () => {
  assert.match(SUBSIDIE_CHECK_LOGICA, /a\.signaal_bevroren\?\.herkomst === 'energie' && a\.signaal_bevroren\?\.maatregelNaam === signaal\.bron\.label/)
})

test('subsidieCheck.js: een pand-signaal levert nooit een adviespunt-koppeling op (dossierniveau, geen maatregel)', () => {
  const functieMatch = SUBSIDIE_CHECK_LOGICA.match(/export function vindGekoppeldAdviespunt\([\s\S]*?\n\}/)[0]
  assert.match(functieMatch, /if \(!signaal\?\.bron\) return null/)
  assert.equal(/bron\.type === 'pand'/.test(functieMatch), false)
})

test('Geen nieuwe migratie toegevoegd voor deze ronde: dossier_subsidies/dossier_subsidie_maatregelen/rvo_subsidie_index blijven de enige betrokken tabellen (0035/0036)', () => {
  const migratiesDir = path.join(HIER, '..', '..', '..', 'supabase', 'migrations')
  const bestanden = readdirSync(migratiesDir)
  const subsidieMigraties = bestanden.filter((f) => /subsidie/i.test(f))
  assert.deepEqual(subsidieMigraties.sort(), ['0035_dossier_subsidies.sql', '0036_rvo_subsidie_index.sql'])
})
