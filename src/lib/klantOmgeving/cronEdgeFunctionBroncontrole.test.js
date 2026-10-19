import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Correctieronde (2026-10-19, interne security-review na oplevering van het
 * projectplan "Klantwaarde-uitbreidingen"): jaarrapportage-sync/index.ts en
 * loyaliteitskorting-sync/index.ts draaiden als Deno Edge Functions met
 * uitsluitend verify_jwt:true als poort — dat bewijst alleen een geldig
 * Supabase-JWT, en de PUBLIEKE anon-key is er zo een. Elke aanroeper met
 * die publieke sleutel kon dus met dryRun:false echte mail laten versturen
 * naar alle klanten. Deze bestanden draaien als Deno Edge Function
 * (jsr:-imports, Deno-globals) en zijn daarom niet rechtstreeks met de kale
 * Node-testrunner uit te voeren — zelfde, herhaaldelijk aangetroffen
 * beperking als elders in dit project (zie sendMailBroncontrole.test.js).
 * Statische broncontrole op de aangebrachte fixes.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))
function leesEdgeFunction(naam) {
  return readFileSync(path.join(HIER, '..', '..', '..', 'supabase', 'functions', naam, 'index.ts'), 'utf8')
}

const JAARRAPPORTAGE = leesEdgeFunction('jaarrapportage-sync')
const LOYALITEITSKORTING = leesEdgeFunction('loyaliteitskorting-sync')
const SUBSIDIE_DEADLINE_MELDING = leesEdgeFunction('subsidie-deadline-melding')
const CRON_SECRET_MIGRATIE = readFileSync(path.join(HIER, '..', '..', '..', 'supabase', 'migrations', '0057_cron_shared_secret.sql'), 'utf8')

for (const [naam, bron] of [
  ['jaarrapportage-sync', JAARRAPPORTAGE],
  ['loyaliteitskorting-sync', LOYALITEITSKORTING],
]) {
  test(`${naam}/index.ts: weigert fail-closed (401, generieke foutmelding) zonder geconfigureerde of overeenkomende CRON_SHARED_SECRET, vóór elke dossierlezing`, () => {
    assert.match(bron, /const verwachteSecret = Deno\.env\.get\('CRON_SHARED_SECRET'\)/)
    assert.match(bron, /!verwachteSecret \|\| !gegevenSecret \|\| !secretsKomenOvereen\(gegevenSecret, verwachteSecret\)/)
    assert.match(bron, /status: 401/)
    const secretCheckIndex = bron.indexOf('verwachteSecret')
    const dossierQueryIndex = bron.indexOf(".from('dossiers')")
    assert.ok(secretCheckIndex > -1 && dossierQueryIndex > -1 && secretCheckIndex < dossierQueryIndex, 'de secret-check moet vóór de dossierquery staan')
  })

  test(`${naam}/index.ts: vergelijkt de secret constant-time (timingSafeEqual), nooit met ===/==`, () => {
    assert.match(bron, /import \{ timingSafeEqual \} from 'node:crypto'/)
    assert.match(bron, /function secretsKomenOvereen/)
    assert.match(bron, /return timingSafeEqual\(bufGegeven, bufVerwacht\)/)
  })

  test(`${naam}/index.ts: dryRun blijft standaard true, alleen een letterlijke false in de body schakelt 'm uit`, () => {
    assert.match(bron, /dryRun = body\?\.dryRun !== false/)
  })

  test(`${naam}/index.ts: gebruikt kalendermaanden (setUTCMonth), geen "N * 30 dagen"-benadering`, () => {
    assert.match(bron, /datum\.setUTCMonth\(datum\.getUTCMonth\(\) - (11|12)\)/)
    assert.equal(/\* 30 \* 24 \* 60 \* 60 \* 1000/.test(bron), false)
  })

  test(`${naam}/index.ts: claimt het dossier atomair (voorwaardelijke UPDATE + .select().maybeSingle()) vóórdat er verstuurd wordt — dubbel-verzend-bescherming bij gelijktijdige aanroepen`, () => {
    assert.match(bron, /\.select\('dossier_id'\)\s*\n\s*\.maybeSingle\(\)/)
    assert.match(bron, /if \(claimError \|\| !geclaimd\)/)
  })

  test(`${naam}/index.ts: draait de claim terug bij een mislukte verzending (Resend-fout of onverwachte throw) — nooit "verzonden" bij een mislukte poging`, () => {
    const foutResendIndex = bron.indexOf("actie: 'fout_resend'")
    const terugdraaiVoorFout = bron.lastIndexOf('.update(', foutResendIndex)
    assert.ok(terugdraaiVoorFout > -1 && terugdraaiVoorFout < foutResendIndex, 'vóór de fout_resend-regel moet de claim worden teruggedraaid')
    assert.match(bron, /catch \(err\) \{[\s\S]*?\.update\(\{[\s\S]*?\}\)\.eq\('dossier_id', dossier\.dossier_id\)/)
  })
}

test('jaarrapportage-sync/index.ts: bouwBesparing() behandelt een ontbrekende/ongeldige totaleBesparing NIET als € 0 — geen verzonnen nulbesparing', () => {
  assert.match(JAARRAPPORTAGE, /function isBruikbaarGetal/)
  assert.match(JAARRAPPORTAGE, /!isBruikbaarGetal\(resultaat\.huidigeKosten\) \|\| !isBruikbaarGetal\(resultaat\.totaleBesparing\)\) return null/)
  assert.equal(/totaleBesparing \?\? 0/.test(JAARRAPPORTAGE), false)
})

test('jaarrapportage-sync/index.ts: de openingszin claimt geen vast "een jaar geleden" meer (kan jaren achtereen worden verstuurd)', () => {
  assert.equal(/Het is alweer een jaar geleden sinds het laatste advies/.test(JAARRAPPORTAGE), false)
  assert.match(JAARRAPPORTAGE, /function openingszin/)
})

test('loyaliteitskorting-sync/index.ts: kortingspercentages (4,5/9,5/15) zijn ongewijzigd en verwijzen naar het bevestigde projectplan', () => {
  assert.match(LOYALITEITSKORTING, /percentage: 4\.5/)
  assert.match(LOYALITEITSKORTING, /percentage: 9\.5/)
  assert.match(LOYALITEITSKORTING, /percentage: 15/)
  assert.match(LOYALITEITSKORTING, /bevestigd door Richard/)
})

test('loyaliteitskorting-sync/index.ts: query sluit dossiers zonder bekende afgerond_op expliciet uit (geen gok-backfill)', () => {
  assert.match(LOYALITEITSKORTING, /\.not\('afgerond_op', 'is', null\)/)
})

test('0057_cron_shared_secret.sql: beide cron-jobs sturen voortaan een X-Cron-Secret-header mee, met de waarde uit Supabase Vault — nooit een letterlijk geheim in de migratie zelf', () => {
  assert.match(CRON_SECRET_MIGRATIE, /cron\.unschedule\('jaarrapportage-maandelijkse-check'\)/)
  assert.match(CRON_SECRET_MIGRATIE, /cron\.unschedule\('loyaliteitskorting-maandelijkse-check'\)/)
  const xCronSecretRegels = CRON_SECRET_MIGRATIE.match(/'X-Cron-Secret', coalesce\(\(select decrypted_secret from vault\.decrypted_secrets where name = 'cron_shared_secret' limit 1\), ''\)/g)
  assert.equal(xCronSecretRegels?.length, 2)
  assert.equal(/CRON_SHARED_SECRET\s*=\s*'/.test(CRON_SECRET_MIGRATIE), false)
})

test('subsidie-deadline-melding/index.ts: CORS/OPTIONS-preflight is aanwezig volgens het bestaande patroon in de repository', () => {
  assert.match(SUBSIDIE_DEADLINE_MELDING, /if \(req\.method === 'OPTIONS'\)/)
  assert.match(SUBSIDIE_DEADLINE_MELDING, /Access-Control-Allow-Origin/)
  assert.match(SUBSIDIE_DEADLINE_MELDING, /const ALLOWED_ORIGINS = new Set/)
})

test('subsidie-deadline-melding/index.ts: body bevat alleen nog dossierId/deadlineId — regeling/deadlineDatum/budgetStatus komen niet meer uit de request', () => {
  assert.match(SUBSIDIE_DEADLINE_MELDING, /let body: \{ dossierId\?: string; deadlineId\?: string \}/)
  assert.equal(/body\.regeling/.test(SUBSIDIE_DEADLINE_MELDING), false)
  assert.equal(/body\.deadlineDatum/.test(SUBSIDIE_DEADLINE_MELDING), false)
  assert.equal(/body\.budgetStatus/.test(SUBSIDIE_DEADLINE_MELDING), false)
})

test('subsidie-deadline-melding/index.ts: haalt regeling/deadline_datum/budget_status server-side op uit subsidie_deadlines, en weigert een onbekende of uitgezette deadline', () => {
  assert.match(SUBSIDIE_DEADLINE_MELDING, /\.from\('subsidie_deadlines'\)\.select\('\*'\)\.eq\('id', body\.deadlineId\)\.maybeSingle\(\)/)
  assert.match(SUBSIDIE_DEADLINE_MELDING, /if \(deadlineError \|\| !deadline\) return jsonResponse/)
  assert.match(SUBSIDIE_DEADLINE_MELDING, /if \(!deadline\.actief\) return jsonResponse/)
  assert.match(SUBSIDIE_DEADLINE_MELDING, /deadline\.regeling/)
  assert.match(SUBSIDIE_DEADLINE_MELDING, /deadline\.deadline_datum/)
  assert.match(SUBSIDIE_DEADLINE_MELDING, /deadline\.budget_status/)
})

test('subsidie-deadline-melding/index.ts: verstuurt alleen als het dossier daadwerkelijk een relevant, open subsidietraject voor de regeling heeft', () => {
  assert.match(SUBSIDIE_DEADLINE_MELDING, /function dossierHeeftRelevantTraject/)
  assert.match(SUBSIDIE_DEADLINE_MELDING, /if \(!dossierHeeftRelevantTraject\(deadline\.regeling, dossierSubsidies \?\? \[\], dossier\.status\)\)/)
  assert.match(SUBSIDIE_DEADLINE_MELDING, /dossierStatus !== 'open'\) return false/)
})
