import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * Broncontrole (statische source-grep, zelfde patroon als de rest van dit
 * project — geen jsdom/React-renderer, zie bv.
 * opnameSubsidieKoppelingBroncontrole.test.js) voor de UX-auditronde
 * 2026-10-09, feature 1: admin kan zelf een Klant/Pand/Dossier aanmaken
 * en bestaande Klant/Pand-gegevens bewerken.
 */
const migratie = readFileSync('supabase/migrations/0043_admin_klant_pand_dossier_aanmaken.sql', 'utf8')
const apiJs = readFileSync('src/lib/klantOmgeving/api.js', 'utf8')
const adminDossiersJsx = readFileSync('src/pages/AdminDossiers.jsx', 'utf8')
const nieuweKlantModalJsx = readFileSync('src/components/admin/NieuweKlantModal.jsx', 'utf8')
const dossierDetailJsx = readFileSync('src/pages/DossierDetail.jsx', 'utf8')
const pandSectieJsx = readFileSync('src/components/klantOmgeving/PandSectie.jsx', 'utf8')

test('0043: admin_maak_klant_pand_dossier() is SECURITY DEFINER en controleert is_admin() voordat er iets wordt ingevoegd', () => {
  assert.match(migratie, /security definer/)
  assert.match(migratie, /if not public\.is_admin\(\) then/)
  // De is_admin()-check moet VOOR de eerste insert staan (geen insert die al kan gebeuren voor de check).
  const checkIndex = migratie.indexOf('if not public.is_admin()')
  const eersteInsertIndex = migratie.indexOf('insert into public.klanten')
  assert.ok(checkIndex > -1 && eersteInsertIndex > -1 && checkIndex < eersteInsertIndex)
})

test('0043: EXECUTE wordt van public/anon ingetrokken en alleen aan authenticated gegeven (zelfde patroon als de andere SECURITY DEFINER-RPCs)', () => {
  assert.match(migratie, /revoke all on function public\.admin_maak_klant_pand_dossier\(jsonb, jsonb, text\) from public, anon;/)
  assert.match(migratie, /grant execute on function public\.admin_maak_klant_pand_dossier\(jsonb, jsonb, text\) to authenticated;/)
})

test('0043: Klant + Pand + koppeling + Dossier worden in dezelfde functie (dus dezelfde transactie) aangemaakt — geen gedeeltelijke aanmaak mogelijk', () => {
  assert.match(migratie, /insert into public\.klanten/)
  assert.match(migratie, /insert into public\.panden/)
  assert.match(migratie, /insert into public\.klant_pand_relaties/)
  assert.match(migratie, /insert into public\.dossiers/)
})

test('0043: pand_snapshot wordt expliciet opgebouwd (dossiers.pand_snapshot is NOT NULL, zie 0001_init.sql)', () => {
  assert.match(migratie, /v_pand_snapshot/)
  assert.match(migratie, /pand_snapshot/)
})

test('api.js: maakKlantPandDossierAlsAdmin() roept de admin_maak_klant_pand_dossier-RPC aan, geen rechtstreekse losse inserts', () => {
  assert.match(apiJs, /export async function maakKlantPandDossierAlsAdmin/)
  assert.match(apiJs, /supabase\.rpc\('admin_maak_klant_pand_dossier'/)
})

test('AdminDossiers.jsx: heeft een "Nieuwe klant toevoegen"-knop die de NieuweKlantModal opent', () => {
  assert.match(adminDossiersJsx, /import \{ NieuweKlantModal \} from '\.\.\/components\/admin\/NieuweKlantModal'/)
  assert.match(adminDossiersJsx, /Nieuwe klant toevoegen/)
  assert.match(adminDossiersJsx, /<NieuweKlantModal onClose=/)
})

test('AdminDossiers.jsx: klant-bewerken gebruikt de al bestaande updateKlant()/valideerKlantRegistratie(), geen nieuwe databasewijziging', () => {
  assert.match(adminDossiersJsx, /import \{[^}]*updateKlant[^}]*\} from '\.\.\/lib\/klantOmgeving\/api'/)
  assert.match(adminDossiersJsx, /await updateKlant\(bewerkKlantId, bewerkForm\)/)
})

test('NieuweKlantModal.jsx: de "Aanmaken"-knop wordt uitgeschakeld tijdens het opslaan (dubbelklik-bescherming)', () => {
  assert.match(nieuweKlantModalJsx, /disabled=\{bezig\}/)
  assert.match(nieuweKlantModalJsx, /setBezig\(true\)/)
})

test('NieuweKlantModal.jsx: valideert zowel klant- als pandvelden vóór het aanroepen van de RPC', () => {
  assert.match(nieuweKlantModalJsx, /valideerKlantRegistratie/)
  assert.match(nieuweKlantModalJsx, /valideerNieuwPand/)
  const valideerIndex = nieuweKlantModalJsx.indexOf('setFouten(alleFouten)')
  const rpcIndex = nieuweKlantModalJsx.indexOf('maakKlantPandDossierAlsAdmin(')
  assert.ok(valideerIndex > -1 && rpcIndex > -1 && valideerIndex < rpcIndex)
})

test('DossierDetail.jsx: PandSectie wordt uitsluitend getoond voor een admin', () => {
  assert.match(dossierDetailJsx, /\{isAdmin \? <PandSectie pand=\{dossier\.panden\}/)
})

test('PandSectie.jsx: bewerken gebruikt de al bestaande updatePand() (geen nieuwe databasewijziging) en valideert gebruikstype', () => {
  assert.match(pandSectieJsx, /import \{ updatePand \} from '\.\.\/\.\.\/lib\/klantOmgeving\/api'/)
  assert.match(pandSectieJsx, /await updatePand\(pand\.pand_id,/)
  assert.match(pandSectieJsx, /valideerNieuwPand\(form\)/)
})
