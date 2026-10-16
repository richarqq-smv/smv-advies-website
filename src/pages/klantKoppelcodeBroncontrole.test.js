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
const INLOGGEN = lees('Inloggen.jsx')
const REGISTREREN = lees('Registreren.jsx')
const PENDING_KOPPELCODE = lees('..', 'lib', 'klantOmgeving', 'pendingKoppelcode.js')

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
  assert.match(ACCOUNT, /const \[klantKeuze, setKlantKeuze\] = useState\(null\)/)
  assert.match(ACCOUNT, /async function submitKoppelcode\(e\) \{/)
  assert.match(ACCOUNT, /await koppelKlantMetCode\(\{/)
  // Na een gelukte koppeling wordt dezelfde laadAlles() herbruikt als na registreerKlant() — geen tweede ophaalpad.
  const fnMatch = ACCOUNT.match(/async function submitKoppelcode\([\s\S]*?\n  \}/)
  assert.ok(fnMatch)
  assert.match(fnMatch[0], /await laadAlles\(\)/)
})

/**
 * Vervolgronde (2026-10-15, "klantkoppeling afronden"): koppelModus (boolean,
 * registratieformulier als stille standaard) is vervangen door klantKeuze
 * (string|null) — een expliciet, gelijkwaardig keuzescherm vóór beide
 * formulieren, zodat de koppelcode-route niet langer een onderaan verstopte
 * link is maar een eigen, even prominente kaart. Geen backend-wijziging:
 * beide paden roepen nog steeds exact dezelfde registreerKlant()/
 * koppelKlantMetCode()-functies aan als voorheen.
 */
test('Account.jsx: toont eerst een neutraal, gelijkwaardig keuzescherm (klantKeuze === null) vóór zowel het koppelcode- als het registratieformulier', () => {
  assert.match(ACCOUNT, /!klant \? klantKeuze === null \? \(/)
  assert.match(ACCOUNT, /heeft u al eerder contact gehad met SMV Advies/)
  assert.match(ACCOUNT, /onClick=\{\(\) => setKlantKeuze\('koppelcode'\)\}/)
  assert.match(ACCOUNT, /onClick=\{\(\) => setKlantKeuze\('nieuw'\)\}/)
  // Allebei de keuzekaarten moeten er even prominent uitzien — geen van
  // beide mag de standaard-stijlklasse van de ander missen terwijl de ander
  // die wel heeft (zelfde <button>-grootte/padding, alleen rand-/achtergrond-
  // accent verschilt).
  const keuzeScherm = ACCOUNT.slice(ACCOUNT.indexOf("klantKeuze === null ? ("), ACCOUNT.indexOf(") : klantKeuze === 'koppelcode'"))
  const kaartKnoppen = keuzeScherm.match(/className="flex flex-col gap-1\.5 rounded-xl border-2[^"]*"/g) ?? []
  assert.equal(kaartKnoppen.length, 2, 'beide keuzekaarten moeten dezelfde basisopmaak (rounded-xl border-2 flex flex-col) gebruiken')
})

test('Account.jsx: "Terug"-knoppen in beide formulieren zetten klantKeuze terug naar null (terug naar het keuzescherm, niet rechtstreeks naar het andere formulier)', () => {
  const terugKnoppen = ACCOUNT.match(/onClick=\{\(\) => \{\s*\n\s*setKlantKeuze\(null\)/g) ?? []
  assert.equal(terugKnoppen.length, 2, 'zowel het koppelcode- als het registratieformulier moet een eigen "Terug naar keuzescherm"-knop hebben')
})

test('Account.jsx: koppelt nooit automatisch op e-mailadres — klantKeuze/koppelKlantMetCode/registreerKlant bevatten geen e-mailvergelijking of -opzoeking', () => {
  assert.equal(/where.*email|\.eq\('email'|\.match\(\{\s*email/i.test(ACCOUNT), false)
})

/**
 * Koppelcode-eerst-aanmelding (2026-10-16): een klant die al bij SMV bekend
 * is, hoeft niet meer eerst blind te registreren en pas daarna op /account
 * uit te zoeken hoe koppelen werkt — vanaf /inloggen kan de koppelcode nu
 * als allereerste stap ingevuld worden, gevolgd door e-mail/wachtwoord op
 * dezelfde /registreren-pagina (geen nieuwe route, alleen ?koppelcode=1).
 * Omdat koppel_klant_met_code() een ingelogde sessie vereist (0048, "Niet
 * ingelogd."), kan de code pas na de verplichte e-mailbevestiging echt
 * verzilverd worden — pendingKoppelcode.js overbrugt dat via localStorage,
 * Account.jsx rondt de koppeling af bij de eerste laadAlles() na inloggen.
 */
test('Inloggen.jsx: linkt naar de koppelcode-eerst-variant van /registreren (?koppelcode=1)', () => {
  assert.match(INLOGGEN, /Heeft u een koppelcode van SMV Advies ontvangen\?/)
  assert.match(INLOGGEN, /to=\{`\$\{ROUTES\.registreren\}\?koppelcode=1`\}/)
})

test('pendingKoppelcode.js: bewaart/leest/wist via één gedeelde localStorage-sleutel, met try/catch rond elke aanroep', () => {
  assert.match(PENDING_KOPPELCODE, /const STORAGE_KEY = 'smv-pending-koppelcode'/)
  assert.match(PENDING_KOPPELCODE, /export function bewaarPendingKoppelcode/)
  assert.match(PENDING_KOPPELCODE, /export function leesPendingKoppelcode/)
  assert.match(PENDING_KOPPELCODE, /export function wisPendingKoppelcode/)
  // Zelfde defensieve patroon als lib/consent.js: nooit rechtstreeks
  // localStorage aanroepen zonder try/catch (privénavigatie).
  const tryCount = (PENDING_KOPPELCODE.match(/\btry\s*\{/g) ?? []).length
  assert.equal(tryCount, 3, 'elke van de 3 functies moet zijn eigen try/catch rond localStorage hebben')
})

test('Registreren.jsx: koppelModus (?koppelcode=1) vraagt eerst code/naam/telefoon, dan pas e-mail/wachtwoord, en bewaart de code vóór signUp()', () => {
  assert.match(REGISTREREN, /import \{ bewaarPendingKoppelcode \} from '\.\.\/lib\/klantOmgeving\/pendingKoppelcode'/)
  assert.match(REGISTREREN, /const koppelModus = searchParams\.get\('koppelcode'\) === '1'/)
  assert.match(REGISTREREN, /const \[koppelStap, setKoppelStap\] = useState\('gegevens'\)/)
  assert.match(REGISTREREN, /function submitKoppelGegevens\(e\) \{/)
  // bewaarPendingKoppelcode() moet vóór signUp() staan, niet erna (anders is
  // de code nog niet weggeschreven als de e-mailbevestigingsredirect de
  // pagina al heeft ververst).
  const submitFn = REGISTREREN.match(/async function submit\(e\) \{[\s\S]*?\n  \}/)
  assert.ok(submitFn)
  const bewaarIndex = submitFn[0].indexOf('bewaarPendingKoppelcode(')
  const signUpIndex = submitFn[0].indexOf('supabase.auth.signUp(')
  assert.ok(bewaarIndex !== -1 && signUpIndex !== -1 && bewaarIndex < signUpIndex)
})

/**
 * Ronde 2026-10-16: een signUp() voor een e-mailadres dat al een bevestigd
 * account heeft, geeft bij Supabase bewust GEEN foutmelding (anti-
 * enumeratie) en verstuurt ook geen nieuwe bevestigingsmail — herkenbaar
 * aan een lege identities-array in de respons. Zonder deze check toonde
 * Registreren.jsx ten onrechte "controleer uw e-mail" terwijl er nooit een
 * mail is verstuurd (live geconstateerd: auth-log toont "user_repeated_signup",
 * geen mail-verzending).
 */
test('Registreren.jsx: herkent een signUp() voor een al-bevestigd e-mailadres (lege identities-array) en toont dan geen "controleer uw e-mail", maar een link naar inloggen', () => {
  assert.match(REGISTREREN, /const \[accountBestaatAl, setAccountBestaatAl\] = useState\(false\)/)
  const submitFn = REGISTREREN.match(/async function submit\(e\) \{[\s\S]*?\n  \}/)
  assert.ok(submitFn)
  assert.match(submitFn[0], /const \{ data, error \} = await supabase\.auth\.signUp\(/)
  assert.match(submitFn[0], /if \(data\?\.user\?\.identities\?\.length === 0\) \{/)
  assert.match(submitFn[0], /setAccountBestaatAl\(true\)/)
  // De identities-check moet vóór setAangemeld(true) staan, anders wordt
  // alsnog het "controleer uw e-mail"-scherm getoond.
  const identitiesIndex = submitFn[0].indexOf('setAccountBestaatAl(true)')
  const aangemeldIndex = submitFn[0].indexOf('setAangemeld(true)')
  assert.ok(identitiesIndex !== -1 && aangemeldIndex !== -1 && identitiesIndex < aangemeldIndex)
  // De UI-tak voor accountBestaatAl moet vóór de aangemeld-tak gerenderd
  // worden (anders kan aangemeld nooit tonen, puur volgorde-onafhankelijk
  // maar wel zo geschreven) en linkt naar inloggen.
  assert.match(REGISTREREN, /\{accountBestaatAl \? \(/)
  assert.match(REGISTREREN, /Dit e-mailadres heeft al een account\./)
  assert.match(REGISTREREN, /<Link to=\{ROUTES\.inloggen\} state=\{location\.state\} className="mt-4 inline-block text-accent hover:underline">/)
})

test('Account.jsx: probeert bij het laden automatisch een bewaarde koppelcode te verzilveren, eenmalig per paginabezoek, met terugvalscherm bij mislukken', () => {
  assert.match(ACCOUNT, /import \{ leesPendingKoppelcode, wisPendingKoppelcode \} from '\.\.\/lib\/klantOmgeving\/pendingKoppelcode'/)
  assert.match(ACCOUNT, /const autoKoppelPoging = useRef\(false\)/)
  const laadAllesFn = ACCOUNT.match(/async function laadAlles\(\) \{[\s\S]*?\n  \}/)
  assert.ok(laadAllesFn)
  assert.match(laadAllesFn[0], /if \(!mijnKlant\?\.klant && !autoKoppelPoging\.current\) \{/)
  assert.match(laadAllesFn[0], /autoKoppelPoging\.current = true/)
  assert.match(laadAllesFn[0], /await koppelKlantMetCode\(pending\)/)
  assert.match(laadAllesFn[0], /setKlantKeuze\('koppelcode'\)/)
  // Bij zowel succes als mislukking wordt de bewaarde code gewist — nooit
  // een oneindige herhaalpoging met een verlopen/al-gebruikte code.
  const wisAanroepen = (laadAllesFn[0].match(/wisPendingKoppelcode\(\)/g) ?? []).length
  assert.equal(wisAanroepen, 2)
})
