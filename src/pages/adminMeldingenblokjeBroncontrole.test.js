import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * Broncontrole (zelfde statische source-grep-patroon als de rest van dit
 * project) voor het dashboard-meldingenblokje (ronde 2026-10-16):
 * klantactiviteit + mailstatus op /admin. Het pure-logica-gedrag zelf
 * (activiteitenFeed.js) heeft eigen unit-tests; dit bestand bewaakt alleen
 * de bedrading (migratie → Edge Function → api.js → Admin.jsx) en de
 * RLS-vorm van de nieuwe tabel.
 */
const MIGRATIE = readFileSync('supabase/migrations/0052_mail_log.sql', 'utf8')
const EDGE_FUNCTIE = readFileSync('supabase/functions/send-email/index.ts', 'utf8')
const API = readFileSync('src/lib/klantOmgeving/api.js', 'utf8')
const ADMIN_JSX = readFileSync('src/pages/Admin.jsx', 'utf8')
const RECENTE_ACTIVITEIT_JSX = readFileSync('src/components/klantOmgeving/RecenteActiviteit.jsx', 'utf8')

test('0052: mail_log heeft RLS aan met uitsluitend een admin-only SELECT-policy — geen enkele INSERT/UPDATE/DELETE-policy voor de normale client', () => {
  assert.match(MIGRATIE, /alter table public\.mail_log enable row level security;/)
  assert.match(MIGRATIE, /create policy mail_log_select_admin on public\.mail_log for select\s*\n\s*using \(public\.is_admin\(\)\);/)
  assert.equal(/for insert|for update|for delete/.test(MIGRATIE), false)
})

test('0052: type-kolom heeft een check-constraint op de 4 bekende mailtypes uit send-email/index.ts', () => {
  assert.match(MIGRATIE, /check \(type in \('contact', 'energie-lead', 'energie-confirm', 'mjop'\)\)/)
})

test('send-email/index.ts: logt elke verzendpoging (gelukt/mislukt) naar mail_log via de service-role-sleutel, nooit de aanroeper-credentials', () => {
  assert.match(EDGE_FUNCTIE, /import \{ createClient \} from 'jsr:@supabase\/supabase-js@2'/)
  assert.match(EDGE_FUNCTIE, /Deno\.env\.get\('SUPABASE_SERVICE_ROLE_KEY'\)/)
  assert.match(EDGE_FUNCTIE, /\.from\('mail_log'\)\.insert\(\{/)
  assert.match(EDGE_FUNCTIE, /gelukt: resendResponse\.ok/)
  // De logpoging zelf mag nooit de mailrespons laten crashen — moet in een
  // eigen try/catch staan, los van de eigenlijke jsonResponse()-aanroepen.
  const logBlok = EDGE_FUNCTIE.match(/try \{\s*\n\s*const supabaseLog[\s\S]*?\n {2}\} catch \{[\s\S]*?\n {2}\}/)
  assert.ok(logBlok, 'de mail_log-insert staat niet in een eigen try/catch')
})

/**
 * Ronde 2026-10-17: de Resend-aanroep en de mail_log-logging zijn
 * herbruikbaar gemaakt (sendViaResend()/logMailAttempt()) omdat de
 * Turnstile-captcha-ronde ze op 3 plekken nodig had (contact/mjop, en
 * lead+confirm binnen het samengevoegde 'energie'-type). Per tak moet
 * gelden: eerst verzenden, dán loggen (zodat `gelukt` het echte resultaat
 * weerspiegelt) — zie ook de 'Cloudflare Turnstile'-test hieronder voor de
 * captcha-check die daar weer vóór staat.
 */
test('send-email/index.ts: logging gebeurt ná de Resend-aanroep (zodat gelukt het echte resultaat weerspiegelt) — zowel voor de energie-tak (lead + confirm) als de overige mailtypes', () => {
  const energieTak = EDGE_FUNCTIE.match(/if \(isEnergie\) \{[\s\S]*?\n {2}\}\n\n {2}const resendResponse/)
  assert.ok(energieTak, 'de energie-tak (lead + confirm) is niet gevonden')
  const leadSendIndex = energieTak[0].indexOf('await sendViaResend(apiKey, leadMessage!)')
  const leadLogIndex = energieTak[0].indexOf("logMailAttempt('energie-lead'")
  const confirmSendIndex = energieTak[0].indexOf('await sendViaResend(apiKey, confirmMessage!)')
  const confirmLogIndex = energieTak[0].indexOf("logMailAttempt('energie-confirm'")
  assert.ok(leadSendIndex > -1 && leadLogIndex > -1 && confirmSendIndex > -1 && confirmLogIndex > -1)
  assert.ok(leadSendIndex < leadLogIndex && leadLogIndex < confirmSendIndex && confirmSendIndex < confirmLogIndex)

  const overigeTakIndex = EDGE_FUNCTIE.indexOf('const resendResponse = await sendViaResend(apiKey, message!)')
  const overigeLogIndex = EDGE_FUNCTIE.indexOf('await logMailAttempt(body.type!, message!.to, resendResponse)')
  assert.ok(overigeTakIndex > -1 && overigeLogIndex > -1 && overigeTakIndex < overigeLogIndex)
})

/**
 * Cloudflare Turnstile (ronde 2026-10-17): elke aanroep moet een geldig
 * token meesturen, geverifieerd vóórdat er iets aan Resend uitgegeven
 * wordt — zie het "goedkope check eerst"-commentaar bij verifyTurnstile()
 * in de Edge Function zelf.
 */
test('send-email/index.ts: Turnstile-verificatie gebeurt vóór elke Resend-aanroep, en faalt dicht (geen secret = geen geldige verificatie)', () => {
  assert.match(EDGE_FUNCTIE, /async function verifyTurnstile\(token: string \| undefined\)/)
  assert.match(EDGE_FUNCTIE, /if \(!secret\) return false/)
  assert.match(EDGE_FUNCTIE, /challenges\.cloudflare\.com\/turnstile\/v0\/siteverify/)
  const turnstileCheckIndex = EDGE_FUNCTIE.indexOf('const turnstileOk = await verifyTurnstile(')
  const firstSendIndex = EDGE_FUNCTIE.indexOf('await sendViaResend(')
  assert.ok(turnstileCheckIndex > -1 && firstSendIndex > -1 && turnstileCheckIndex < firstSendIndex)
})

/**
 * Een Turnstile-token is maar één keer bruikbaar — de twee energie-
 * indicatie-mails (intern + klantbevestiging) gaan daarom sinds deze ronde
 * in één request onder type 'energie', met precies één captcha-check voor
 * beide. 'energie-lead'/'energie-confirm' zijn bewust geen eigen,
 * rechtstreeks aanroepbare typen meer in BUILDERS.
 */
test("send-email/index.ts: 'energie-lead'/'energie-confirm' staan niet meer los in BUILDERS — alleen 'contact'/'mjop', de energie-mails lopen via het samengevoegde 'energie'-type", () => {
  const buildersBlok = EDGE_FUNCTIE.match(/const BUILDERS = new Map<[\s\S]*?\]\)/)
  assert.ok(buildersBlok)
  assert.equal(/'energie-lead'|'energie-confirm'/.test(buildersBlok[0]), false)
  assert.match(buildersBlok[0], /'mjop'/)
  assert.match(buildersBlok[0], /'contact'/)
  assert.match(EDGE_FUNCTIE, /const isEnergie = body\.type === 'energie'/)
})

test('api.js: adminListKlantActiviteitRuw() haalt 4 brontabellen op, adminListMailLog() leest uitsluitend mail_log', () => {
  assert.match(API, /export async function adminListKlantActiviteitRuw/)
  const fn = API.match(/export async function adminListKlantActiviteitRuw[\s\S]*?\n\}/)
  assert.ok(fn)
  assert.match(fn[0], /\.from\('klant_koppelcodes'\)/)
  assert.match(fn[0], /\.from\('contactpersonen'\)/)
  assert.match(fn[0], /\.from\('documenten'\)/)
  assert.match(fn[0], /\.from\('klant_pand_relaties'\)/)
  assert.match(API, /export async function adminListMailLog[\s\S]*?\.from\('mail_log'\)/)
})

test('Admin.jsx: bouwt de activiteitenfeed uit alle 5 categorieën en toont die via RecenteActiviteit', () => {
  assert.match(ADMIN_JSX, /import \{ RecenteActiviteit \} from '\.\.\/components\/klantOmgeving\/RecenteActiviteit'/)
  assert.match(ADMIN_JSX, /adminListKlantActiviteitRuw\(\), adminListMailLog\(\)/)
  assert.match(ADMIN_JSX, /koppelcodeActiviteiten\(koppelcodes\)/)
  assert.match(ADMIN_JSX, /accountKoppelingActiviteiten\(contactpersonen\)/)
  assert.match(ADMIN_JSX, /documentActiviteiten\(documenten, klantAccountIds\)/)
  assert.match(ADMIN_JSX, /pandActiviteiten\(pandRelaties\)/)
  assert.match(ADMIN_JSX, /mailActiviteiten\(mailLog\)/)
  assert.match(ADMIN_JSX, /<RecenteActiviteit activiteiten=\{activiteiten\} \/>/)
})

test('RecenteActiviteit.jsx: toont een lege-staat zonder activiteit, en markeert een mislukte mail visueel anders dan de rest', () => {
  assert.match(RECENTE_ACTIVITEIT_JSX, /Nog geen activiteit om te tonen\./)
  assert.match(RECENTE_ACTIVITEIT_JSX, /item\.type === 'mail-mislukt'/)
})

/**
 * Ronde 2026-10-16 (vervolg): de lijst zelf is in-/uitklapbaar gemaakt
 * (standaard dicht) zodat het blokje geen grote ruimte inneemt zodra er
 * veel activiteit is — de "Meldingen"-kop en toelichting blijven wel
 * altijd zichtbaar, alleen de <ul> met items wordt getoggled.
 */
test('RecenteActiviteit.jsx: de activiteitenlijst is in-/uitklapbaar en staat standaard dicht', () => {
  assert.match(RECENTE_ACTIVITEIT_JSX, /const \[open, setOpen\] = useState\(false\)/)
  assert.match(RECENTE_ACTIVITEIT_JSX, /aria-expanded=\{open\}/)
  // De <ul> met items mag alleen renderen als open true is EN er activiteit is.
  const ulBlok = RECENTE_ACTIVITEIT_JSX.match(/\) : open \? \(\s*<ul[\s\S]*?<\/ul>\s*\) : null/)
  assert.ok(ulBlok, 'de <ul> moet voorwaardelijk op `open` renderen')
  // De kop ("Meldingen"/"Recente activiteit"/toelichting) staat buiten die
  // voorwaardelijke render, dus blijft zichtbaar ongeacht open/dicht.
  const koptekstIndex = RECENTE_ACTIVITEIT_JSX.indexOf('Recente activiteit</h2>')
  const toggleIndex = RECENTE_ACTIVITEIT_JSX.indexOf('setOpen((o) => !o)')
  assert.ok(koptekstIndex > -1 && toggleIndex > -1 && koptekstIndex < toggleIndex)
})
