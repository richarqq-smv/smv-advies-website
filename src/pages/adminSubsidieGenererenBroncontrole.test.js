import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * Broncontrole (statische source-grep) voor de UX-auditronde 2026-10-09,
 * feature 4: "Subsidieblad genereren" mag niet zomaar een document opleveren
 * zolang de aangeraakte maatregelen nog onvoldoende gegevens hebben. Zie ook
 * de pure-logicatests in subsidieDocumentData.test.js (kritiekeOntbrekendeVelden/heeftInhoud).
 */
const pageJsx = readFileSync('src/pages/AdminSubsidieBegeleiding.jsx', 'utf8')

test('AdminSubsidieBegeleiding.jsx: kanGenereren is afgeleid van de bestaande heeftInhoud/kritiekeOntbrekendeVelden, geen nieuw verzonnen criterium', () => {
  assert.match(pageJsx, /documentData\?\.kritiekeOntbrekendeVelden/)
  assert.match(pageJsx, /documentData\?\.heeftInhoud/)
  assert.match(pageJsx, /const kanGenereren = heeftInhoud && kritiekeOntbrekendeVelden\.length === 0/)
})

test('AdminSubsidieBegeleiding.jsx: de knop "Subsidieblad genereren" is uitgeschakeld zolang kanGenereren false is', () => {
  assert.match(pageJsx, /disabled=\{genererenBezig \|\| !kanGenereren\}/)
})

test('AdminSubsidieBegeleiding.jsx: genereerSubsidieblad() controleert kanGenereren opnieuw vóórdat er daadwerkelijk iets wordt gegenereerd (verdediging in de diepte, niet alleen de knop)', () => {
  const functieStart = pageJsx.indexOf('async function genereerSubsidieblad')
  const functieDeel = pageJsx.slice(functieStart, functieStart + 400)
  assert.match(functieDeel, /if \(!kanGenereren\)/)
  assert.match(functieDeel, /setFout\(/)
  assert.match(functieDeel, /return\s*\n\s*\}/)
})

test('AdminSubsidieBegeleiding.jsx: de adviseur ziet welke concrete velden nog ontbreken, niet alleen een generieke melding', () => {
  assert.match(pageJsx, /kritiekeOntbrekendeVelden\.map\(\(v\) => \(/)
  assert.match(pageJsx, /Subsidieblad genereren is nog niet mogelijk/)
})

test('AdminSubsidieBegeleiding.jsx: onderscheid tussen "nog niets ingevuld" en "wel iets ingevuld maar onvolledig" in de melding', () => {
  assert.match(pageJsx, /!heeftInhoud \?/)
  assert.match(pageJsx, /Er zijn nog geen opnamegegevens voor een maatregel of fiscale regeling vastgelegd/)
})
