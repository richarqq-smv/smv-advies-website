import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * StepAdvies.jsx (laatste stap van de MJOP-wizard) — bewaakt de
 * informatieve verwijzing naar het telefonisch adviesgesprek (werkfase
 * 2026-10-05). Bewust GEEN rechtstreekse boekings-CTA hier: op dit punt
 * in de flow kan er nog geen dossier bestaan (zie het eindrapport,
 * sectie UX) — deze test bewaakt dus ook dat er GEEN directe aanroep naar
 * de boekings-RPC/API in dit bestand terechtkomt.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
}

test('StepAdvies.jsx: wijst de klant op de mogelijkheid van een telefonisch adviesgesprek', () => {
  const bron = lees('StepAdvies.jsx')
  assert.match(bron, /Telefonisch adviesgesprek/)
  assert.match(bron, /20-30 minuten/)
})

test('StepAdvies.jsx: roept de boekingsfunctionaliteit zelf niet rechtstreeks aan (nog geen dossier op dit punt)', () => {
  const bron = lees('StepAdvies.jsx')
  assert.equal(/boekTelefonischeAfspraak|getBeschikbareMomenten/.test(bron), false)
})
