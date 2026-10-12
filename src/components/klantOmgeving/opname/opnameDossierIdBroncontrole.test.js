import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * Broncontrole voor implementatieronde 2026-10-12, punt 5: opnamefoto's
 * kregen geen dossiernummer-prefix omdat `dossierId` nergens in de
 * component-keten AdminOpname → OpnameOnderdelenStap → OpnameWaarnemingCard
 * werd doorgegeven, waardoor `uploadDocument()` terugviel op zijn eigen
 * default `dossierId = null` en de bestaande
 * `documenten_benoem_met_dossiernummer`-trigger (0045) nooit afging.
 */
const adminOpnameJsx = readFileSync('src/pages/AdminOpname.jsx', 'utf8')
const onderdelenStapJsx = readFileSync('src/components/klantOmgeving/opname/OpnameOnderdelenStap.jsx', 'utf8')
const waarnemingCardJsx = readFileSync('src/components/klantOmgeving/opname/OpnameWaarnemingCard.jsx', 'utf8')

test('AdminOpname.jsx geeft dossierId door aan OpnameOnderdelenStap', () => {
  const start = adminOpnameJsx.indexOf('<OpnameOnderdelenStap')
  const deel = adminOpnameJsx.slice(start, start + 400)
  assert.match(deel, /dossierId=\{dossierId\}/)
})

test('OpnameOnderdelenStap.jsx ontvangt dossierId en geeft het door aan OpnameWaarnemingCard', () => {
  const propsStart = onderdelenStapJsx.indexOf('export function OpnameOnderdelenStap(')
  const propsDeel = onderdelenStapJsx.slice(propsStart, propsStart + 300)
  assert.match(propsDeel, /dossierId,/)

  const callStart = onderdelenStapJsx.indexOf('<OpnameWaarnemingCard')
  const callDeel = onderdelenStapJsx.slice(callStart, callStart + 400)
  assert.match(callDeel, /dossierId=\{dossierId\}/)
})

test('OpnameWaarnemingCard.jsx ontvangt dossierId en geeft het door aan uploadDocument()', () => {
  assert.match(waarnemingCardJsx, /export function OpnameWaarnemingCard\(\{[^}]*\bdossierId\b[^}]*\}\)/)
  const fotoStart = waarnemingCardJsx.indexOf('async function fotoToevoegen')
  const fotoDeel = waarnemingCardJsx.slice(fotoStart, fotoStart + 500)
  assert.match(fotoDeel, /uploadDocument\(\{ klantId, dossierId, opnameId,/)
})
