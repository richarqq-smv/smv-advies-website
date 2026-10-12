import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Broncontrole voor implementatieronde 2026-10-12, punt 3: koppelcode tegen
 * dubbele klantrecords. Statische source-checks (zelfde methode als de
 * andere *Broncontrole.test.js-bestanden in dit project — geen jsdom/React-
 * testrunner beschikbaar). De migratie zelf (RLS/SECURITY DEFINER-gedrag) is
 * al live adversarieel getest via Supabase execute_sql; dit bestand bewaakt
 * alleen de vorm (deny-by-default, search_path, grants) als regressieguard.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8')
}

const MIGRATIE = lees('..', '..', 'supabase', 'migrations', '0048_klant_koppelcode.sql')
const API = lees('..', 'lib', 'klantOmgeving', 'api.js')
const ADMIN_DOSSIERS = lees('AdminDossiers.jsx')
const ACCOUNT = lees('Account.jsx')

test('0048: klant_koppelcodes heeft RLS aan maar GEEN enkele policy — uitsluitend bereikbaar via de twee SECURITY DEFINER-functies', () => {
  assert.match(MIGRATIE, /alter table public\.klant_koppelcodes enable row level security;/)
  assert.equal(/create policy/.test(MIGRATIE), false)
})

test('0048: de ruwe code wordt nooit opgeslagen, alleen een sha256-hash (code_hash)', () => {
  assert.match(MIGRATIE, /code_hash text not null/)
  assert.equal(/\bruwe_code\b.*column|column.*ruwe_code/.test(MIGRATIE), false)
  assert.match(MIGRATIE, /encode\(extensions\.digest\(v_ruwe_code, 'sha256'\), 'hex'\)/)
})

test('0048: admin_genereer_klant_koppelcode() en koppel_klant_met_code() zijn beide SECURITY DEFINER met een leeg search_path, en revoke/grant volgt het bestaande patroon', () => {
  for (const fn of ['admin_genereer_klant_koppelcode', 'koppel_klant_met_code']) {
    const re = new RegExp(`create or replace function public\\.${fn}\\([\\s\\S]*?language plpgsql\\s*\\n\\s*security definer\\s*\\n\\s*set search_path = ''`)
    assert.match(MIGRATIE, re, `${fn} moet security definer + set search_path = '' hebben`)
  }
  assert.match(MIGRATIE, /revoke all on function public\.admin_genereer_klant_koppelcode\(uuid\) from public, anon;\s*\ngrant execute on function public\.admin_genereer_klant_koppelcode\(uuid\) to authenticated;/)
  assert.match(MIGRATIE, /revoke all on function public\.koppel_klant_met_code\(text, text, text, text\) from public, anon;\s*\ngrant execute on function public\.koppel_klant_met_code\(text, text, text, text\) to authenticated;/)
})

test('0048: admin_genereer_klant_koppelcode() controleert is_admin() en verloopt oudere ongebruikte codes via UPDATE, niet via DELETE', () => {
  const fnMatch = MIGRATIE.match(/create or replace function public\.admin_genereer_klant_koppelcode[\s\S]*?\$\$;/)
  assert.ok(fnMatch)
  assert.match(fnMatch[0], /if not public\.is_admin\(\) then/)
  assert.match(fnMatch[0], /update public\.klant_koppelcodes set verloopt_op = now\(\)/)
  assert.equal(/delete from/i.test(fnMatch[0]), false)
})

test('0048: koppel_klant_met_code() consumeert de code atomair (UPDATE ... WHERE gebruikt_op is null ... RETURNING) en weigert als het account al gekoppeld is', () => {
  const fnMatch = MIGRATIE.match(/create or replace function public\.koppel_klant_met_code[\s\S]*?\$\$;/)
  assert.ok(fnMatch)
  assert.match(fnMatch[0], /update public\.klant_koppelcodes\s*\n\s*set gebruikt_op = now\(\), gebruikt_door = v_uid\s*\n\s*where code_hash = encode\(extensions\.digest\(trim\(p_code\), 'sha256'\), 'hex'\)\s*\n\s*and gebruikt_op is null\s*\n\s*and verloopt_op > now\(\)\s*\n\s*returning klant_id into v_klant_id;/)
  assert.match(fnMatch[0], /if exists \(select 1 from public\.contactpersonen where account_id = v_uid\) then/)
  // Strikte '>' (niet '>='), zie het eerder gevonden now()-per-transactie-bugfix.
  assert.match(fnMatch[0], /and verloopt_op > now\(\)/)
})

test('api.js: genereerKlantKoppelcode() en koppelKlantMetCode() roepen uitsluitend de twee nieuwe RPC\'s aan, geen rechtstreekse tabeltoegang', () => {
  assert.match(API, /export async function genereerKlantKoppelcode\(klantId\) \{\s*\n\s*return throwOnError\(await supabase\.rpc\('admin_genereer_klant_koppelcode', \{ p_klant_id: klantId \}\)\)/)
  assert.match(API, /export async function koppelKlantMetCode\(\{ code, naam, email = null, telefoon = null \}\) \{\s*\n\s*return throwOnError\(await supabase\.rpc\('koppel_klant_met_code', \{ p_code: code, p_naam: naam, p_email: email, p_telefoon: telefoon \}\)\)/)
})

test('AdminDossiers.jsx: toont een "Koppelcode genereren"-knop per klant en de ruwe code uitsluitend eenmalig, lokaal in state (niet opnieuw opgehaald)', () => {
  assert.match(ADMIN_DOSSIERS, /import \{ [^}]*genereerKlantKoppelcode[^}]* \} from '\.\.\/lib\/klantOmgeving\/api'/)
  assert.match(ADMIN_DOSSIERS, /const \[koppelcodePerKlant, setKoppelcodePerKlant\] = useState\(\{\}\)/)
  assert.match(ADMIN_DOSSIERS, /async function genereerKoppelcode\(klantId\) \{/)
  assert.match(ADMIN_DOSSIERS, /const code = await genereerKlantKoppelcode\(klantId\)/)
  assert.match(ADMIN_DOSSIERS, /Deze code wordt hier niet opnieuw getoond\./)
})

test('Account.jsx: biedt in de "nog geen klant"-staat een alternatief koppelcode-formulier naast de bestaande registratie, via koppelKlantMetCode()', () => {
  assert.match(ACCOUNT, /import \{\s*\n\s*getMijnKlant,\s*\n\s*registreerKlant,\s*\n\s*koppelKlantMetCode,/)
  assert.match(ACCOUNT, /const \[koppelModus, setKoppelModus\] = useState\(false\)/)
  assert.match(ACCOUNT, /async function submitKoppelcode\(e\) \{/)
  assert.match(ACCOUNT, /await koppelKlantMetCode\(\{/)
  // Na een gelukte koppeling wordt dezelfde laadAlles() herbruikt als na registreerKlant() — geen tweede ophaalpad.
  const fnMatch = ACCOUNT.match(/async function submitKoppelcode\([\s\S]*?\n  \}/)
  assert.ok(fnMatch)
  assert.match(fnMatch[0], /await laadAlles\(\)/)
})

test('Account.jsx: de koppelcode-weg blijft een bewuste keuze — de standaard registratieformulier blijft het eerste wat getoond wordt, met een link om over te schakelen', () => {
  assert.match(ACCOUNT, /Heeft u een koppelcode van SMV Advies ontvangen\?/)
  assert.match(ACCOUNT, /Toch geen koppelcode — bedrijfsgegevens zelf invullen/)
})
