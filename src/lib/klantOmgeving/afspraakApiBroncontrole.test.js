import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Broncontrole op de drie nieuwe klantgerichte afspraakfuncties in api.js
 * (werkfase 2026-10-05) — api.js zelf is I/O (Supabase-calls), dus geen
 * geschikte kandidaat voor een functioneel unit-test zonder mocks (zelfde
 * reden waarom er voor de rest van dit bestand ook geen los testbestand
 * bestaat). Deze test bewaakt in plaats daarvan op broncodeniveau dat elke
 * functie de juiste, exact benoemde RPC aanroept, en dat de boekingsfunctie
 * nooit een rauwe Postgres-foutcode doorlaat naar de UI.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
}

test('api.js: getBeschikbareMomenten roept de RPC beschikbare_momenten aan met p_datum', () => {
  const bron = lees('api.js')
  assert.match(bron, /export async function getBeschikbareMomenten/)
  assert.match(bron, /supabase\.rpc\('beschikbare_momenten', \{ p_datum: datumIso \}\)/)
})

test('api.js: getMijnTelefonischeAfspraak roept de RPC mijn_telefonische_afspraak aan met p_dossier_id', () => {
  const bron = lees('api.js')
  assert.match(bron, /export async function getMijnTelefonischeAfspraak/)
  assert.match(bron, /supabase\.rpc\('mijn_telefonische_afspraak', \{ p_dossier_id: dossierId \}\)/)
})

test('api.js: boekTelefonischeAfspraak roept de RPC boek_telefonische_afspraak aan met exact dossier_id/datum/starttijd', () => {
  const bron = lees('api.js')
  assert.match(bron, /export async function boekTelefonischeAfspraak/)
  assert.match(bron, /supabase\.rpc\('boek_telefonische_afspraak', \{/)
  assert.match(bron, /p_dossier_id: dossierId/)
  assert.match(bron, /p_datum: datumIso/)
  assert.match(bron, /p_starttijd: starttijd/)
})

test('api.js: boekTelefonischeAfspraak zet een exclusion-violation (23P01) om naar een vriendelijke Nederlandse melding', () => {
  const bron = lees('api.js')
  const fnBody = bron.match(/export async function boekTelefonischeAfspraak[\s\S]*?\n}/)[0]
  assert.match(fnBody, /23P01/)
  assert.match(fnBody, /net niet meer beschikbaar/)
})
