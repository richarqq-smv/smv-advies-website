import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Broncontrole voor de opname->subsidie-koppeling (feature-verzoek na de
 * gerichte inhoudelijke uitbreidingsronde, 2026-10-08): de adviseur vult
 * de subsidie-specifieke velden (oppervlakte/Rd-of-U-waarde/meldcode/
 * "aangebracht?") tijdens de opname zelf in, en die gegevens staan
 * automatisch op de subsidiepagina — zonder een tweede, losstaand
 * dataspoor. Statische source-checks (zelfde methode als de andere
 * *Broncontrole.test.js-bestanden in dit project — geen jsdom/React-
 * testrunner beschikbaar).
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8')
}

const ADMIN_OPNAME = lees('AdminOpname.jsx')
const ADMIN_SUBSIDIE_BEGELEIDING = lees('AdminSubsidieBegeleiding.jsx')
const ONDERDELEN_STAP = lees('..', 'components', 'klantOmgeving', 'opname', 'OpnameOnderdelenStap.jsx')
const SUBSIDIE_KAART = lees('..', 'components', 'klantOmgeving', 'opname', 'OpnameSubsidieKaart.jsx')

test('OpnameOnderdelenStap.jsx: rendert OpnameSubsidieKaart per maatregel die maatregelenVoorOnderdeel() voor dat onderdeel teruggeeft', () => {
  assert.match(ONDERDELEN_STAP, /import \{ maatregelenVoorOnderdeel \} from '\.\.\/\.\.\/\.\.\/lib\/subsidie\/opnameSubsidieKoppeling'/)
  assert.match(ONDERDELEN_STAP, /maatregelenVoorOnderdeel\(o\.onderdeel\)/)
  assert.match(ONDERDELEN_STAP, /<OpnameSubsidieKaart/)
})

test('AdminOpname.jsx: haalt dossier_subsidie_specificaties op bij het laden (listDossierSubsidieSpecificaties), gekoppeld aan dezelfde dossierId als de opname', () => {
  assert.match(ADMIN_OPNAME, /listDossierSubsidieSpecificaties\(dossierId\)/)
  assert.match(ADMIN_OPNAME, /naarSpecificatiesPerMaatregel\(subsidieRijen\)/)
})

test('AdminOpname.jsx: schrijft subsidiewijzigingen weg via dezelfde upsertDossierSubsidieSpecificatie() als de subsidiepagina — geen tweede, eigen opslagpad', () => {
  const functieMatch = ADMIN_OPNAME.match(/async function subsidieWijzig\([\s\S]*?\n  \}/)
  assert.ok(functieMatch, 'subsidieWijzig() niet gevonden in AdminOpname.jsx')
  assert.match(functieMatch[0], /await upsertDossierSubsidieSpecificatie\(dossierId, maatregelKey,/)
})

test('AdminSubsidieBegeleiding.jsx en AdminOpname.jsx gebruiken dezelfde upsert-functie (upsertDossierSubsidieSpecificatie) — exact één schrijfpad naar dossier_subsidie_specificaties', () => {
  assert.match(ADMIN_SUBSIDIE_BEGELEIDING, /upsertDossierSubsidieSpecificatie\(dossierId, maatregelKey,/)
  assert.match(ADMIN_OPNAME, /upsertDossierSubsidieSpecificatie\(dossierId, maatregelKey,/)
})

test('OpnameSubsidieKaart.jsx: toont geen status-badge of berekeningsresultaat (dat hoort bij de subsidiepagina) — uitsluitend de invoervelden zelf plus een korte toelichting', () => {
  assert.equal(/STATUS_BADGE/.test(SUBSIDIE_KAART), false)
  assert.equal(/m\.berekening/.test(SUBSIDIE_KAART), false)
  assert.match(SUBSIDIE_KAART, /komen automatisch terug op de subsidiepagina/)
})

test('OpnameSubsidieKaart.jsx: schakelt de velden uit wanneer de opname niet meer bewerkt mag worden (afgeronde opname), niet alleen tijdens het opslaan', () => {
  assert.match(SUBSIDIE_KAART, /const disabled = !magBewerken/)
})

test('geen nieuwe migratie nodig voor deze koppeling — dossier_subsidie_specificaties (0038-0040) wordt hergebruikt, geen vierde migratie toegevoegd voor de opname-koppeling zelf', () => {
  // Bijgewerkt (2026-10-09, EIA/MIA/Vamil-vervolgronde): 0042 voegt wél een
  // nieuwe, los daarvan gerechtvaardigde migratie toe (doelgroep "zakelijk"),
  // dit bestand blijft uitsluitend bevestigen dat de opname-koppeling zelf
  // (dit bestand se eigen onderwerp) geen EIGEN migratie nodig had.
  const migratiesDir = path.join(HIER, '..', '..', 'supabase', 'migrations')
  const bestanden = readdirSync(migratiesDir)
  const subsidieMigraties = bestanden.filter((f) => /subsidie/i.test(f))
  assert.deepEqual(subsidieMigraties.sort(), [
    '0035_dossier_subsidies.sql',
    '0036_rvo_subsidie_index.sql',
    '0038_dossier_subsidie_specificaties.sql',
    '0039_dossier_subsidie_specificaties_uitbreiding.sql',
    '0040_dossier_subsidie_specificaties_glas_ventilatie.sql',
    '0042_dossier_subsidie_specificaties_doelgroep_zakelijk.sql',
  ])
})
