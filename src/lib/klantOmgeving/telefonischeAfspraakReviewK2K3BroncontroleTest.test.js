import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Broncontrole op migratie 0034 — verwerkt bevinding K-2 en K-3 uit de
 * onafhankelijke review van migratie 0032 (K-1 is al gedekt door
 * migratie 0033 en diens eigen broncontrole-test). Zelfde methode als
 * telefonischeAfspraakMigratieBroncontrole.test.js: statische checks op
 * de SQL-tekst, geen vervanging van de live RPC-tests die al tegen de
 * echte database zijn uitgevoerd.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8')
}

const MIGRATIE_PAD = ['..', '..', '..', 'supabase', 'migrations', '0034_telefonische_afspraak_review_k2_k3.sql']

test('migratie 0034: "dossier bestaat niet" en "dossier is niet van jou" geven nu dezelfde, generieke foutmelding (K-2)', () => {
  const sql = lees(...MIGRATIE_PAD)
  const fnBody = sql.match(/create or replace function public\.boek_telefonische_afspraak[\s\S]*?\$\$;/)[0]
  assert.match(fnBody, /if not found or not public\.is_member_of_klant\(v_dossier\.klant_id\) then/)
  // Nooit meer een los 42501-pad voor "niet gemachtigd" — beide gevallen
  // lopen nu door dezelfde generieke 'Dossier niet gevonden.'-raise.
  assert.equal(/errcode = '42501'/.test(fnBody), false)
})

test('migratie 0034: weigert een tweede actieve telefonische afspraak voor hetzelfde dossier (K-3)', () => {
  const sql = lees(...MIGRATIE_PAD)
  const fnBody = sql.match(/create or replace function public\.boek_telefonische_afspraak[\s\S]*?\$\$;/)[0]
  assert.match(fnBody, /pa\.type = 'telefonisch_adviesgesprek'/)
  assert.match(fnBody, /pa\.status in \('gepland', 'afgerond'\)/)
  // Een geannuleerde afspraak mag géén nieuwe boeking blokkeren.
  assert.equal(/'geannuleerd'.*status in|status in.*'geannuleerd'/.test(fnBody), false)
  // Moet vóór de insert staan, niet erna.
  const dubbeleBoekingIndex = fnBody.indexOf("pa.type = 'telefonisch_adviesgesprek'")
  const insertIndex = fnBody.indexOf('insert into public.planning_afspraken')
  assert.ok(dubbeleBoekingIndex !== -1 && insertIndex !== -1 && dubbeleBoekingIndex < insertIndex)
})

test('migratie 0034: laat de advisory lock, de overlapcheck en de exclusion-violation-afvang uit 0032/0033 ongewijzigd', () => {
  const sql = lees(...MIGRATIE_PAD)
  const fnBody = sql.match(/create or replace function public\.boek_telefonische_afspraak[\s\S]*?\$\$;/)[0]
  assert.match(fnBody, /pg_advisory_xact_lock\(hashtext\(p_datum::text\)\)/)
  assert.match(fnBody, /when exclusion_violation then/)
  assert.match(fnBody, /Dit moment is net niet meer beschikbaar/)
  assert.match(fnBody, /security definer/i)
  assert.match(fnBody, /set search_path = ''/)
})

test('migratie 0034: voegt geen nieuwe RLS-policy of grant-wijziging toe (alleen CREATE OR REPLACE FUNCTION)', () => {
  const sql = lees(...MIGRATIE_PAD)
  assert.equal(/create policy|revoke |grant /i.test(sql), false)
})
