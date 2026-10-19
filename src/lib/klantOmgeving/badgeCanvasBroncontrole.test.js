import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * Broncontrole voor de SMV Duurzaamheidsbadge (projectplan
 * "Klantwaarde-uitbreidingen", Fase 3 — #11, ronde 2026-10-19).
 * badgeCanvas.js gebruikt de browser Canvas API/Image — net als
 * adviesrapportDocx.js bewust statische bron-checks i.p.v. uitvoeren
 * (geen jsdom/canvas-polyfill in dit project, zie CLAUDE.md-conventie).
 */
const BRON = readFileSync('src/lib/klantOmgeving/badgeCanvas.js', 'utf8')

test('De verplichte disclaimer-tekst staat letterlijk in de bron en wordt altijd getekend, nooit conditioneel weggelaten', () => {
  assert.match(BRON, /BADGE_DISCLAIMER = 'Op basis van advies door SMV Advies — geen officieel energielabel of certificaat'/)
  // De disclaimer-tekenregel staat buiten elke if/conditie binnen de functie
  // (in tegenstelling tot bv. het bedrijfsnaam- en CO2-blok hierboven) —
  // gecontroleerd door te verifiëren dat er geen "if" vlak vóór de regel
  // staat die 'm zou kunnen overslaan.
  const start = BRON.indexOf('woordenwrap(ctx, BADGE_DISCLAIMER')
  assert.ok(start > -1)
  const ervoor = BRON.slice(Math.max(0, start - 200), start)
  assert.doesNotMatch(ervoor, /if \(/)
})

test('Gebruikt het wit-op-transparant footer-logo (voor de donkere achtergrond), niet het navy-gekleurde logo.png', () => {
  assert.match(BRON, /logo-footer-light\.png/)
  assert.doesNotMatch(BRON, /(?<!footer-light)['"]\/logo\.png['"]/)
})

test('Een ontbrekend/niet-ladend logo crasht de badge niet — try/catch rond het laden, badge gaat door zonder logo', () => {
  const start = BRON.indexOf('try {')
  const blok = BRON.slice(start, start + 500)
  assert.match(blok, /laadAfbeelding\('\/logo-footer-light\.png'\)/)
  assert.match(blok, /\} catch \{/)
})

test('genereerBadgePng tekent uitsluitend met de al-berekende totalen-cijfers, geen eigen herberekening', () => {
  const start = BRON.indexOf('export async function genereerBadgePng')
  const functieDeel = BRON.slice(start, start + 3500)
  assert.match(functieDeel, /totalen\.besparingPerJaar/)
  assert.match(functieDeel, /totalen\.co2PerJaar/)
  assert.doesNotMatch(functieDeel, /bouwEnergieKostenOverzicht|energie_snapshot/)
})

test('Het CO2-blok wordt alleen getekend als co2PerJaar bekend is — geen "0 kg" tonen voor een dossier zonder CO2-cijfer', () => {
  assert.match(BRON, /if \(totalen\.co2PerJaar != null\) \{/)
})

test('Geeft PNG-bytes terug via canvas.toBlob, consistent met tekenEnergieKostenGrafiek in adviesrapportDocx.js', () => {
  assert.match(BRON, /canvas\.toBlob\(resolve, 'image\/png'\)/)
  assert.match(BRON, /return new Uint8Array\(buffer\)/)
})
