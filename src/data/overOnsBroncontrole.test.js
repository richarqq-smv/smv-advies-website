import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Over.jsx (2026-10-02, vervolg op de websiteoptimalisatieronde) — de
 * audit signaleerde geen enkel menselijk gezicht achter het bedrijf. De
 * klant bevestigde: Richard is de oprichter en momenteel de enige die
 * voor SMV Advies werkt. Aanvankelijk nog geen foto beschikbaar (toen
 * bewaakte deze test juist de áfwezigheid van een `<img>`, om een nep-
 * afbeelding te voorkomen); op 2026-10-21 heeft de klant de echte
 * headshot aangeleverd (public/richard-headshot.png, zonder achtergrond).
 * Deze test bewaakt nu dat (a) de naam er staat, (b) er geen verzonnen
 * details bij staan (geen jarental "X jaar ervaring", geen opleidingsclaim,
 * geen certificering — niets dat niet expliciet is aangeleverd), (c) de
 * echte foto daadwerkelijk gebruikt wordt met zinvolle alt-tekst (geen
 * decoratieve/lege alt, want dit is nu betekenisvolle content), en (d) de
 * LinkedIn-link intact is.
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

test('Over.jsx: gebruikt de echte, aangeleverde headshot van Richard met zinvolle alt-tekst', () => {
  const bron = leesZonderComments('..', 'pages', 'Over.jsx')
  assert.match(bron, /<img\s[\s\S]*?src="\/richard-headshot\.png"/)
  assert.match(bron, /alt="Richard, oprichter van SMV Advies"/)
})

test('Over.jsx: de headshot-afbeelding bestaat daadwerkelijk in public/', () => {
  const bestandPad = path.join(HIER, '..', '..', 'public', 'richard-headshot.png')
  assert.doesNotThrow(() => readFileSync(bestandPad))
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
