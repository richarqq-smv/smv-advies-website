import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Broncontrole voor de EIA/MIA/Vamil-UI-ronde (2026-10-09, opdracht deel
 * 8/14 "Selectie en UI") — resterende checklistpunten die niet al door
 * fiscaleKoppeling.test.js/fiscaleBedrijfsmiddelen.test.js/
 * subsidieCheck.test.js gedekt zijn: categorie-indeling, één primaire
 * actie per kaart, geen ruwe HTML/SVG-tekst (dangerouslySetInnerHTML),
 * en dat elke kaart z'n bron als een gewone werkende link rendert.
 * Statische source-checks (geen jsdom/React-testrunner beschikbaar).
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8')
}

const SUBSIDIE_CHECK = lees('..', 'components', 'klantOmgeving', 'SubsidieCheck.jsx')
const ADMIN_SUBSIDIE_BEGELEIDING = lees('AdminSubsidieBegeleiding.jsx')

test('SubsidieCheck.jsx: toont de 3 categorieën uit opdracht §8.2 (ISDE/EIA-MIA-Vamil/Regionaal) als aparte kaarten, plus een losse "Overige regelingen"-sectie', () => {
  assert.match(SUBSIDIE_CHECK, /titel="ISDE — directe subsidie"/)
  assert.match(SUBSIDIE_CHECK, /titel="EIA \/ MIA \/ Vamil — fiscale regelingen"/)
  assert.match(SUBSIDIE_CHECK, /titel="Regionale en lokale regelingen"/)
  assert.match(SUBSIDIE_CHECK, /Overige relevante regelingen/)
})

test('SubsidieCheck.jsx: samenvatting bovenaan toont 4 aantallen, elk afgeleid van een berekende variabele (geen hardcoded getal)', () => {
  assert.match(SUBSIDIE_CHECK, /\{totaalRelevant\}/)
  assert.match(SUBSIDIE_CHECK, /\{totaalOntbrekend\}/)
  assert.match(SUBSIDIE_CHECK, /\{totaalControle\}/)
  assert.match(SUBSIDIE_CHECK, /\{totaalBuitenScope\}/)
  // Geen van de vier is een los getal-literal in de JSX (dat zou een gok/hardcoded cijfer zijn).
  assert.equal(/<p className="text-xl font-semibold[^"]*">\d/.test(SUBSIDIE_CHECK), false)
})

test('SubsidieCheck.jsx/AdminSubsidieBegeleiding.jsx: geen dangerouslySetInnerHTML — alle RVO-/bedrijfsmiddeltekst gaat via React-tekstinterpolatie, nooit ruwe HTML/SVG', () => {
  assert.equal(/dangerouslySetInnerHTML/.test(SUBSIDIE_CHECK), false)
  assert.equal(/dangerouslySetInnerHTML/.test(ADMIN_SUBSIDIE_BEGELEIDING), false)
})

test('SubsidieCheck.jsx: CategorieKaart heeft precies één primaire actie (één Button), nooit meerdere knoppen per kaart', () => {
  const componentMatch = SUBSIDIE_CHECK.match(/function CategorieKaart\([\s\S]*?\n\}/)
  assert.ok(componentMatch, 'CategorieKaart niet gevonden')
  const matches = componentMatch[0].match(/<Button/g) ?? []
  assert.equal(matches.length, 1)
})

test('FiscaleRegelingKaart (AdminSubsidieBegeleiding.jsx): precies één primaire actie buiten de uitklap — "Toevoegen aan dossier", niet "Subsidie aanvragen"', () => {
  const componentMatch = ADMIN_SUBSIDIE_BEGELEIDING.match(/function FiscaleRegelingKaart\([\s\S]*?\n\}/)
  assert.ok(componentMatch, 'FiscaleRegelingKaart niet gevonden')
  const buttonMatches = componentMatch[0].match(/<Button/g) ?? []
  assert.equal(buttonMatches.length, 1)
  assert.match(componentMatch[0], /Toevoegen aan dossier/)
  assert.equal(/Subsidie aanvragen/.test(componentMatch[0]), false)
})

test('FiscaleRegelingKaart: volledige voorwaarden/bewijsstukken/procedure staan achter een <details>-uitklap, niet meteen zichtbaar', () => {
  const componentMatch = ADMIN_SUBSIDIE_BEGELEIDING.match(/function FiscaleRegelingKaart\([\s\S]*?\n\}/)[0]
  assert.match(componentMatch, /<details/)
  assert.match(componentMatch, /<summary/)
})

test('FiscaleRegelingKaart: bron is een gewone <a>-link met target="_blank"\/rel="noopener noreferrer", geen ruwe tekst', () => {
  const componentMatch = ADMIN_SUBSIDIE_BEGELEIDING.match(/function FiscaleRegelingKaart\([\s\S]*?\n\}/)[0]
  assert.match(componentMatch, /<a href=\{b\.bron\.url\} target="_blank" rel="noopener noreferrer"/)
})

test('AdminSubsidieBegeleiding.jsx: EIA\\/MIA\\/Vamil-sectie heeft het anchor-id dat SubsidieCheck.jsx gebruikt om naar door te linken', () => {
  assert.match(ADMIN_SUBSIDIE_BEGELEIDING, /id="eia-mia-vamil-sectie"/)
  assert.match(SUBSIDIE_CHECK, /#eia-mia-vamil-sectie/)
})

test('SubsidieCheck.jsx/AdminSubsidieBegeleiding.jsx: hergebruiken bouwSubsidieDocumentData() — geen tweede, eigen beoordelingslogica voor ISDE\/EIA\/MIA\/Vamil in deze UI-laag', () => {
  assert.match(SUBSIDIE_CHECK, /import \{ bouwSubsidieDocumentData \} from '\.\.\/\.\.\/lib\/subsidie\/subsidieDocumentData'/)
  assert.equal(/beoordeelMaatregel|beoordeelApparaatMaatregel|beoordeelVentilatie/.test(SUBSIDIE_CHECK), false)
})
