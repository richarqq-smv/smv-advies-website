import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Broncontrole voor de pakket-/subsidiearchitectuurronde (2026-10-08) —
 * "een dossier is vanaf creatie technisch klaar voor Gold, ongeacht
 * pakket; pakket bepaalt uitsluitend zichtbaarheid/toegang, nooit welke
 * backenddata bestaat." Vastgesteld tijdens inspectie: deze regel gold al
 * voor dossiercreatie/opnames/advies/subsidies (geen enkele migratie
 * had een pakketcheck op die tabellen) — de enige afwijking was de
 * Subsidies-Accordion-gate in DossierDetail.jsx, die deze ronde is
 * gecorrigeerd. Dit bestand legt de bredere invariant vast, zodat een
 * toekomstige wijziging die opnieuw "if (pakket === 'gold')" rond
 * backenddata zet, hier zichtbaar faalt.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8')
}

const API = lees('api.js')
const DOSSIER_HEALTH_CHECK = lees('dossierHealthCheck.js')
const MIGRATIE_0035_SUBSIDIES = lees('..', '..', '..', 'supabase', 'migrations', '0035_dossier_subsidies.sql')
const MIGRATIE_0036_RVO = lees('..', '..', '..', 'supabase', 'migrations', '0036_rvo_subsidie_index.sql')
const MIGRATIE_0026_TAKEN = lees('..', '..', '..', 'supabase', 'migrations', '0026_dossier_taken.sql')
const MIGRATIE_0029_OPNAMES = lees('..', '..', '..', 'supabase', 'migrations', '0029_opnames.sql')
const MIGRATIE_0025_PAKKET = lees('..', '..', '..', 'supabase', 'migrations', '0025_dossiers_pakket_id.sql')

// --- Dossiercreatie: pand_snapshot/mjop_snapshot altijd aangemaakt, nooit pakketafhankelijk ---

test('api.js: openOfHergebruikDossier() maakt pand_snapshot/mjop_snapshot altijd aan, nooit achter een pakket-conditie', () => {
  const functieMatch = API.match(/export async function openOfHergebruikDossier\([\s\S]*?\n\}/)
  assert.ok(functieMatch, 'openOfHergebruikDossier() niet gevonden')
  const body = functieMatch[0]
  assert.match(body, /pand_snapshot: pandSnapshot/)
  assert.match(body, /mjop_snapshot: mjopSnapshot/)
  // Geen enkele "if (...pakket...)" rond de insert — pakket_id wordt gewoon meegegeven (vaak null, "nog te bepalen"), nooit een gate.
  assert.equal(/if\s*\([^)]*pakket/i.test(body), false)
})

test('api.js: updateDossierPakket() wijzigt uitsluitend pakket_id — geen reconstructie/aanvulling van andere kolommen bij een pakketwijziging (upgrade-scenario)', () => {
  const functieMatch = API.match(/export async function updateDossierPakket\([\s\S]*?\n\}/)
  assert.ok(functieMatch, 'updateDossierPakket() niet gevonden')
  const body = functieMatch[0]
  assert.match(body, /\.update\(\{ pakket_id: pakketId \}\)/)
  // Geen enkele andere write-aanroep in deze functie (geen insert/update naar opnames/dossier_subsidies/dossier_taken/adviespunten) — een upgrade is alleen een kolomwijziging.
  assert.equal(/\.(insert|upsert)\(/.test(body), false)
})

// --- Subsidies/opnames/dossier_taken: backenddata/RLS kent geen pakketgrens ---

test('0035_dossier_subsidies.sql: RLS-policies voor dossier_subsidies(_maatregelen/_documenten) zijn uitsluitend is_admin(), geen pakket_id-check', () => {
  const policies = MIGRATIE_0035_SUBSIDIES.match(/create policy [\s\S]*?;/g) ?? []
  assert.ok(policies.length > 0, 'geen policies gevonden in 0035')
  policies.forEach((policy) => {
    assert.equal(/pakket/i.test(policy), false, `policy bevat een pakketcheck: ${policy}`)
  })
})

test('0036_rvo_subsidie_index.sql: RLS-policy voor rvo_subsidie_index is uitsluitend is_admin(), geen pakket_id-check', () => {
  const policies = MIGRATIE_0036_RVO.match(/create policy [\s\S]*?;/g) ?? []
  assert.ok(policies.length > 0, 'geen policies gevonden in 0036')
  policies.forEach((policy) => {
    assert.equal(/pakket/i.test(policy), false, `policy bevat een pakketcheck: ${policy}`)
  })
})

test('0026_dossier_taken.sql: RLS-policies kennen geen pakketgrens (de UI-gate op "Subsidiebegeleiding & oplevering" is een bewuste, losse commerciële keuze, geen backend-restrictie)', () => {
  const policies = MIGRATIE_0026_TAKEN.match(/create policy [\s\S]*?;/g) ?? []
  assert.ok(policies.length > 0, 'geen policies gevonden in 0026')
  policies.forEach((policy) => {
    assert.equal(/pakket/i.test(policy), false, `policy bevat een pakketcheck: ${policy}`)
  })
})

test('0029_opnames.sql: RLS-policies kennen geen pakketgrens', () => {
  const policies = MIGRATIE_0029_OPNAMES.match(/create policy [\s\S]*?;/g) ?? []
  assert.ok(policies.length > 0, 'geen policies gevonden in 0029')
  policies.forEach((policy) => {
    assert.equal(/pakket/i.test(policy), false, `policy bevat een pakketcheck: ${policy}`)
  })
})

test('0025_dossiers_pakket_id.sql: pakket_id is een vrij, optioneel kolom ("nog te bepalen" toegestaan) — het enige échte pakket-afgedwongen limiet is de bestaande Gold-max-3-adviespunten-trigger', () => {
  assert.match(MIGRATIE_0025_PAKKET, /pakket_id text check \(pakket_id is null or pakket_id in \('basis', 'premium', 'gold'\)\)/)
  assert.match(MIGRATIE_0025_PAKKET, /if v_pakket_id = 'gold' then/)
})

// --- dossierHealthCheck.js: kent zelf geen "gold"-begrip meer (aanroeper bepaalt zichtbaarheid) ---

test('dossierHealthCheck.js: bevat geen hardcoded pakket-waarden meer — zichtbaarheid van de subsidiecategorie is een expliciete boolean van de aanroeper', () => {
  assert.equal(/'gold'|"gold"/.test(DOSSIER_HEALTH_CHECK), false)
  assert.match(DOSSIER_HEALTH_CHECK, /subsidiesZichtbaar = false/)
})
