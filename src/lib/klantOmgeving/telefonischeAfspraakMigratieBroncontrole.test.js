import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Broncontrole op migratie 0032_telefonische_afspraak_planner.sql —
 * bewaakt op SQL-niveau de securityprincipes uit de implementatieopdracht
 * (werkfase 2026-10-05) die een JS-test niet kan afdwingen: geen nieuwe
 * RLS-policy op planning_afspraken (alle klanttoegang loopt via SECURITY
 * DEFINER-functies), een correct afgeschermde search_path, en de
 * exclusion constraint die twee overlappende telefonische afspraken
 * onmogelijk maakt. Dit is géén vervanging van de live RLS/RPC-tests die
 * al tegen de echte database zijn uitgevoerd (zie het eindrapport) — een
 * aanvullende, snel-te-draaien regressiewacht voor de volgende wijziging.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  const volledigPad = path.join(HIER, ...relatievePad)
  return readFileSync(volledigPad, 'utf8')
}

const MIGRATIE_PAD = ['..', '..', '..', 'supabase', 'migrations', '0032_telefonische_afspraak_planner.sql']

test('migratie 0032: breidt het bestaande type uit met telefonisch_adviesgesprek, zonder een bestaande waarde te verwijderen', () => {
  const sql = lees(...MIGRATIE_PAD)
  for (const bestaand of ['kennismaking', 'bedrijfsbezoek', 'adviesgesprek', 'offertebespreking', 'overleg', 'herbeoordeling', 'overig']) {
    assert.match(sql, new RegExp(`'${bestaand}'`), `bestaande waarde '${bestaand}' moet behouden blijven`)
  }
  assert.match(sql, /'telefonisch_adviesgesprek'/)
})

test('migratie 0032: voegt GEEN nieuwe RLS-policy toe op planning_afspraken (alle klanttoegang via functies)', () => {
  const sql = lees(...MIGRATIE_PAD)
  assert.equal(/create policy/i.test(sql), false, 'klanttoegang hoort uitsluitend via SECURITY DEFINER-functies te lopen, niet via een nieuwe policy')
})

test('migratie 0032: alle drie nieuwe functies zijn SECURITY DEFINER met een lege, afgeschermde search_path', () => {
  const sql = lees(...MIGRATIE_PAD)
  for (const fn of ['beschikbare_momenten', 'mijn_telefonische_afspraak', 'boek_telefonische_afspraak']) {
    const fnMatch = sql.match(new RegExp(`create or replace function public\\.${fn}\\([^)]*\\)[\\s\\S]*?\\$\\$;`))
    assert.ok(fnMatch, `functie ${fn} niet gevonden`)
    assert.match(fnMatch[0], /security definer/i)
    assert.match(fnMatch[0], /set search_path = ''/)
  }
})

test('migratie 0032: alle drie nieuwe functies zijn expliciet afgeschermd van public/anon en alleen uitvoerbaar door authenticated', () => {
  const sql = lees(...MIGRATIE_PAD)
  for (const fn of ['beschikbare_momenten(date)', 'mijn_telefonische_afspraak(uuid)', 'boek_telefonische_afspraak(uuid, date, time)']) {
    assert.match(sql, new RegExp(`revoke all on function public\\.${fn.replace(/[().]/g, '\\$&')} from public, anon`))
    assert.match(sql, new RegExp(`grant execute on function public\\.${fn.replace(/[().]/g, '\\$&')} to authenticated`))
  }
})

test('migratie 0032: boek_telefonische_afspraak accepteert uitsluitend dossier_id/datum/starttijd — geen klant_id/status/type-parameter', () => {
  const sql = lees(...MIGRATIE_PAD)
  const signatuur = sql.match(/create or replace function public\.boek_telefonische_afspraak\(([^)]*)\)/)
  assert.ok(signatuur)
  assert.match(signatuur[1], /p_dossier_id uuid/)
  assert.match(signatuur[1], /p_datum date/)
  assert.match(signatuur[1], /p_starttijd time/)
  assert.equal(/p_klant_id|p_status|p_type|p_notitie|p_eindtijd/.test(signatuur[1]), false)
})

test('migratie 0032: boek_telefonische_afspraak verifieert dossier-eigendom via is_member_of_klant vóór elke insert', () => {
  const sql = lees(...MIGRATIE_PAD)
  const fnBody = sql.match(/create or replace function public\.boek_telefonische_afspraak[\s\S]*?\$\$;/)[0]
  assert.match(fnBody, /is_member_of_klant\(v_dossier\.klant_id\)/)
  const insertIndex = fnBody.indexOf('insert into public.planning_afspraken')
  const checkIndex = fnBody.indexOf('is_member_of_klant')
  assert.ok(checkIndex < insertIndex && checkIndex !== -1, 'eigendomscontrole moet vóór de insert staan')
})

test('migratie 0032: boek_telefonische_afspraak weigert een niet-zakelijk pandtype', () => {
  const sql = lees(...MIGRATIE_PAD)
  const fnBody = sql.match(/create or replace function public\.boek_telefonische_afspraak[\s\S]*?\$\$;/)[0]
  assert.match(fnBody, /uitsluitend beschikbaar voor zakelijke panden/)
  for (const type of ['kantoor', 'bedrijfshal', 'winkel', 'horeca', 'praktijk', 'gemengd', 'anders', 'magazijn', 'werkplaats', 'overig']) {
    assert.match(fnBody, new RegExp(`'${type}'`))
  }
})

test('migratie 0032: er bestaat een exclusion constraint die twee overlappende telefonische afspraken verbiedt', () => {
  const sql = lees(...MIGRATIE_PAD)
  assert.match(sql, /exclude using gist/i)
  assert.match(sql, /telefonisch_adviesgesprek_geen_overlap/)
  // Half-open interval [start, eind) — zie opdracht §20.
  assert.match(sql, /'\[\)'/)
  // Partial constraint (alleen dit type) — geen blinde globale overlapgarantie, zie §12.
  assert.match(sql, /where \(type = 'telefonisch_adviesgesprek'/)
})

test('migratie 0032: boek_telefonische_afspraak neemt een transactiegebonden advisory lock per datum vóór de overlapcontrole', () => {
  const sql = lees(...MIGRATIE_PAD)
  const fnBody = sql.match(/create or replace function public\.boek_telefonische_afspraak[\s\S]*?\$\$;/)[0]
  assert.match(fnBody, /pg_advisory_xact_lock/)
  const lockIndex = fnBody.indexOf('pg_advisory_xact_lock')
  const overlapIndex = fnBody.indexOf('Dit moment is net niet meer beschikbaar')
  assert.ok(lockIndex !== -1 && overlapIndex !== -1 && lockIndex < overlapIndex)
})

test('migratie 0032: een exclusion-violation wordt omgezet naar een vriendelijke Nederlandse melding, nooit een rauwe Postgres-foutcode', () => {
  const sql = lees(...MIGRATIE_PAD)
  const fnBody = sql.match(/create or replace function public\.boek_telefonische_afspraak[\s\S]*?\$\$;/)[0]
  assert.match(fnBody, /when exclusion_violation then/)
  assert.match(fnBody, /Dit moment is net niet meer beschikbaar/)
})
