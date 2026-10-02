import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Over.jsx (2026-10-02, vervolg op de websiteoptimalisatieronde) — de
 * audit signaleerde geen enkel menselijk gezicht achter het bedrijf. De
 * klant bevestigde: Richard is de oprichter en momenteel de enige die
 * voor SMV Advies werkt, nog geen foto beschikbaar. Deze test bewaakt dat
 * (a) de naam er staat, (b) er geen verzonnen details bij staan (geen
 * jarental "X jaar ervaring", geen opleidingsclaim, geen certificering —
 * niets dat niet expliciet is aangeleverd), en (c) er geen `<img>` wordt
 * geclaimd als foto terwijl die er nog niet is (placeholder-avatar i.p.v.
 * een kapotte of nep-afbeelding).
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function leesZonderComments(...relatievePad) {
  const volledigPad = path.join(HIER, ...relatievePad)
  const bron = readFileSync(volledigPad, 'utf8')
  return bron.replace(/\/\*[\s\S]*?\*\//g, '')
}

test('Over.jsx: noemt Richard als de persoon achter SMV Advies', () => {
  const bron = leesZonderComments('..', 'pages', 'Over.jsx')
  assert.match(bron, /Richard/)
})

test('Over.jsx: geen <img> voor een nog niet-bestaande foto — placeholder-avatar i.p.v. gefingeerde afbeelding', () => {
  const bron = leesZonderComments('..', 'pages', 'Over.jsx')
  assert.equal(/<img/i.test(bron), false)
})

test('Over.jsx: geen verzonnen ervaring/opleiding/certificering rond Richard', () => {
  const bron = leesZonderComments('..', 'pages', 'Over.jsx')
  assert.equal(/\d+\s*jaar ervaring|gecertificeerd|diploma|afgestudeerd/i.test(bron), false)
})

test('Over.jsx: linkt naar het echte, door de klant aangeleverde LinkedIn-profiel, opent in nieuw tabblad', () => {
  const bron = leesZonderComments('..', 'pages', 'Over.jsx')
  assert.match(bron, /href="https:\/\/www\.linkedin\.com\/in\/richard-schipper\/"/)
  assert.match(bron, /target="_blank"/)
  assert.match(bron, /rel="noopener noreferrer"/)
})
