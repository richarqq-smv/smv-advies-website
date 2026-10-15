import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Broncontrole voor de klantreis-valkuilenronde (2026-10-15): vijf plekken
 * waar een klant zichzelf in de bestaande zelfbedieningsomgeving per
 * ongeluk kon vastzetten of iets onherstelbaar kon verliezen. Zelfde
 * statische-broncontrole-methode als de andere *Broncontrole.test.js-
 * bestanden in dit project (geen jsdom/React-testrunner beschikbaar).
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8')
}

const ACCOUNT = lees('Account.jsx')
const ARCHIEF = lees('Archief.jsx')
const API = lees('..', 'lib', 'klantOmgeving', 'api.js')
const PAND_VALIDATIE = lees('..', 'lib', 'klantOmgeving', 'pandValidatie.js')
const PAND_SECTIE = lees('..', 'components', 'klantOmgeving', 'PandSectie.jsx')
const NIEUWE_KLANT_MODAL = lees('..', 'components', 'admin', 'NieuweKlantModal.jsx')
const MIGRATIE = lees('..', '..', 'supabase', 'migrations', '0050_documenten_zacht_verwijderen.sql')

// --- 1. Documenten zacht verwijderen + herstellen -------------------------

test('0050: voegt verwijderd_op toe aan documenten, met een update-policy en een trigger die alleen die kolom toestaat', () => {
  assert.match(MIGRATIE, /alter table public\.documenten add column verwijderd_op timestamptz;/)
  assert.match(MIGRATIE, /create policy documenten_update on public\.documenten for update/)
  assert.match(MIGRATIE, /create trigger documenten_bewaak_integriteit/)
  const fnMatch = MIGRATIE.match(/create or replace function public\.bewaak_document_integriteit[\s\S]*?\$\$;/)
  assert.ok(fnMatch)
  // Geen is_admin()-uitzondering: de trigger moet voor IEDEREEN (ook admin)
  // elke andere kolom dan verwijderd_op blokkeren — anders zou deze
  // migratie de bestaande "document is onveranderlijk"-garantie doorbreken.
  assert.equal(/is_admin\(\)/.test(fnMatch[0]), false)
  for (const kolom of ['klant_id', 'dossier_id', 'bestandsnaam', 'storage_path', 'omschrijving', 'grootte_bytes', 'content_type', 'geupload_door', 'created_at']) {
    assert.match(fnMatch[0], new RegExp(`NEW\\.${kolom}`), `trigger moet ${kolom} bewaken`)
  }
})

test('api.js: archiveerDocument()/herstelDocument() zetten alleen verwijderd_op, geen storage.remove() meer', () => {
  const archiveerMatch = API.match(/export async function archiveerDocument\([\s\S]*?\n\}/)
  assert.ok(archiveerMatch)
  assert.match(archiveerMatch[0], /update\(\{ verwijderd_op: new Date\(\)\.toISOString\(\) \}\)/)
  assert.equal(/storage\.remove/.test(archiveerMatch[0]), false)

  const herstelMatch = API.match(/export async function herstelDocument\([\s\S]*?\n\}/)
  assert.ok(herstelMatch)
  assert.match(herstelMatch[0], /update\(\{ verwijderd_op: null \}\)/)

  assert.equal(/export (async )?function verwijderDocument/.test(API), false, 'de oude, onherstelbare verwijderDocument() mag niet meer bestaan')
})

test('api.js: de 3 bestaande documentenqueries (klant/dossier/opname) filteren zacht-verwijderde rijen eruit', () => {
  const getMijnDocumentenMatch = API.match(/export async function getMijnDocumenten\([\s\S]*?\n\}/)
  const getDocumentenVoorDossierMatch = API.match(/export async function getDocumentenVoorDossier\([\s\S]*?\n\}/)
  const getDocumentenVoorOpnameMatch = API.match(/export async function getDocumentenVoorOpname\([\s\S]*?\n\}/)
  for (const match of [getMijnDocumentenMatch, getDocumentenVoorDossierMatch, getDocumentenVoorOpnameMatch]) {
    assert.ok(match)
    assert.match(match[0], /\.is\('verwijderd_op', null\)/)
  }
})

test("api.js: listVerwijderdeDocumenten() (klant) en adminListVerwijderdeDocumenten() (admin, alle klanten) gebruiken het spiegelbeeldfilter", () => {
  assert.match(API, /export async function listVerwijderdeDocumenten\(klantId\)/)
  const klantMatch = API.match(/export async function listVerwijderdeDocumenten\([\s\S]*?\n\}/)
  assert.match(klantMatch[0], /\.not\('verwijderd_op', 'is', null\)/)
  assert.match(klantMatch[0], /\.eq\('klant_id', klantId\)/)

  assert.match(API, /export async function adminListVerwijderdeDocumenten\(\)/)
  const adminMatch = API.match(/export async function adminListVerwijderdeDocumenten\([\s\S]*?\n\}/)
  assert.match(adminMatch[0], /\.not\('verwijderd_op', 'is', null\)/)
  assert.match(adminMatch[0], /klanten\(klant_id, naam, bedrijfsnaam\)/)
})

test('Account.jsx: MijnDocumenten roept archiveerDocument/herstelDocument aan en toont een "Onlangs verwijderd"-sectie met Herstellen', () => {
  assert.match(ACCOUNT, /import \{[^}]*archiveerDocument[^}]*herstelDocument[^}]*\} from '\.\.\/lib\/klantOmgeving\/api'/s)
  assert.equal(/\bverwijderDocument\(/.test(ACCOUNT), false)
  assert.match(ACCOUNT, /await archiveerDocument\(document\.document_id\)/)
  assert.match(ACCOUNT, /async function herstellen\(document\)/)
  assert.match(ACCOUNT, /await herstelDocument\(document\.document_id\)/)
  assert.match(ACCOUNT, /Onlangs verwijderd/)
  assert.match(ACCOUNT, /verwijderdeDocumenten\.length > 0/)
})

test('Archief.jsx: toont door klanten verwijderde documenten (admin-breed), met Herstellen per rij', () => {
  assert.match(ARCHIEF, /import \{[^}]*adminListVerwijderdeDocumenten[^}]*herstelDocument[^}]*\} from '\.\.\/lib\/klantOmgeving\/api'/s)
  assert.match(ARCHIEF, /Door klanten verwijderde documenten/)
  assert.match(ARCHIEF, /async function herstelDocumentActie\(documentId\)/)
  assert.match(ARCHIEF, /await herstelDocument\(documentId\)/)
})

// --- 2. Pand-gebruikstype: vrije tekst -> vaste keuzelijst ----------------

test('pandValidatie.js: GEBRUIKSTYPE_LABELS is nu de enige, gedeelde bron (geen duplicaten meer in PandSectie.jsx/NieuweKlantModal.jsx)', () => {
  assert.match(PAND_VALIDATIE, /export const GEBRUIKSTYPE_LABELS = \{/)
  assert.match(PAND_SECTIE, /import \{ valideerNieuwPand, ZAKELIJKE_GEBRUIKSTYPES, GEBRUIKSTYPE_LABELS \} from '\.\.\/\.\.\/lib\/klantOmgeving\/pandValidatie'/)
  assert.equal(/const GEBRUIKSTYPE_LABELS = \{/.test(PAND_SECTIE), false)
  assert.match(NIEUWE_KLANT_MODAL, /import \{ valideerNieuwPand, ZAKELIJKE_GEBRUIKSTYPES, GEBRUIKSTYPE_LABELS \} from '\.\.\/\.\.\/lib\/klantOmgeving\/pandValidatie'/)
  assert.equal(/const GEBRUIKSTYPE_LABELS = \{/.test(NIEUWE_KLANT_MODAL), false)
})

test('Account.jsx: zowel het "nieuw pand"- als het "pand bewerken"-formulier gebruiken een <select> voor gebruikstype, niet langer een vrij tekstveld', () => {
  assert.match(ACCOUNT, /import \{ valideerNieuwPand, ZAKELIJKE_GEBRUIKSTYPES, GEBRUIKSTYPE_LABELS \} from '\.\.\/lib\/klantOmgeving\/pandValidatie'/)
  // Geen enkele TextField meer met label="Gebruikstype" (dat was het oude, vrije veld).
  assert.equal(/TextField[^/]*label="Gebruikstype"/.test(ACCOUNT), false)
  const selectCount = (ACCOUNT.match(/\{ZAKELIJKE_GEBRUIKSTYPES\.map\(\(waarde\) => \(/g) ?? []).length
  assert.equal(selectCount, 2, 'verwacht twee <select>-opties-lijsten: nieuw pand + pand bewerken')
})

test('Account.jsx: submitNieuwPand() en opslaanPand() valideren beide via valideerNieuwPand() vóór het opslaan', () => {
  const submitMatch = ACCOUNT.match(/async function submitNieuwPand\([\s\S]*?\n  \}/)
  assert.ok(submitMatch)
  assert.match(submitMatch[0], /valideerNieuwPand\(nieuwPand\)/)

  const opslaanPandMatch = ACCOUNT.match(/async function opslaanPand\([\s\S]*?\n  \}/)
  assert.ok(opslaanPandMatch)
  assert.match(opslaanPandMatch[0], /valideerNieuwPand\(bewerkForm\)/)
})

// --- 3. "Mijn bedrijf" had geen validatie ----------------------------------

test('Account.jsx: MijnBedrijf.opslaan() valideert voortaan via valideerKlantRegistratie(), zelfde regel als MijnGegevens', () => {
  const mijnBedrijfBlok = ACCOUNT.slice(ACCOUNT.indexOf('function MijnBedrijf('), ACCOUNT.indexOf('// --- Mijn panden'))
  assert.match(mijnBedrijfBlok, /const veldFouten = valideerKlantRegistratie\(form\)/)
  assert.match(mijnBedrijfBlok, /if \(Object\.keys\(veldFouten\)\.length > 0\) return/)
  assert.match(mijnBedrijfBlok, /error=\{fouten\.naam\}/)
  assert.match(mijnBedrijfBlok, /error=\{fouten\.email\}/)
})

// --- 5. E-mailverwarring: accountgegevens-e-mail vs. inlog-e-mailadres -----

test('Account.jsx: MijnGegevens en MijnBedrijf leggen beide uit dat het e-mailveld niet het inlog-e-mailadres is', () => {
  const aantal = (ACCOUNT.match(/niet het e-mailadres waarmee u inlogt/g) ?? []).length
  assert.equal(aantal, 2, 'verwacht deze hint zowel bij Mijn gegevens als bij Mijn bedrijf')
})
