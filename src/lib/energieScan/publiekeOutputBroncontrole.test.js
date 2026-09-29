import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Statische bron-controles (zelfde patroon als
 * lib/dossier/energieSnapshotFormat.test.js): er is geen
 * component-rendertest-infrastructuur in dit project (geen jsdom/
 * @testing-library/react), dus dit test de brontekst van de betrokken
 * .jsx-bestanden i.p.v. het gerenderde resultaat. Comments worden eerst
 * gestript zodat een documentatiezin die toevallig een verboden term noemt
 * niet per ongeluk de test laat falen.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function leesZonderComments(...relatievePad) {
  const volledigPad = path.join(HIER, ...relatievePad)
  const bron = readFileSync(volledigPad, 'utf8')
  return bron.replace(/\/\*[\s\S]*?\*\//g, '')
}

// --- ResultsView.jsx: publieke resultaatweergave (Fase 6) --------------------

test('ResultsView.jsx: importeert niet langer de (verwijderde) MeasureCard met bedragen per maatregel', () => {
  const bron = leesZonderComments('..', '..', 'components', 'energieIndicatie', 'ResultsView.jsx')
  assert.equal(/MeasureCard/.test(bron), false)
})

test('ResultsView.jsx: gebruikt de gedeelde publiekeWeergave-module, geen eigen, parallelle beperkingslogica', () => {
  const bron = leesZonderComments('..', '..', 'components', 'energieIndicatie', 'ResultsView.jsx')
  assert.match(bron, /from ['"]\.\.\/\.\.\/lib\/energieScan\/publiekeWeergave['"]/)
})

test('ResultsView.jsx: toont geen "Totale besparing" of CO₂-cijfer meer als publieke statistiek', () => {
  const bron = leesZonderComments('..', '..', 'components', 'energieIndicatie', 'ResultsView.jsx')
  assert.equal(bron.includes('Totale besparing'), false)
  assert.equal(bron.includes('CO₂-reductie'), false)
})

test('ResultsView.jsx: bevat het "Wat deze indicatie niet weet"-blok', () => {
  const bron = leesZonderComments('..', '..', 'components', 'energieIndicatie', 'ResultsView.jsx')
  assert.match(bron, /Wat deze indicatie niet weet/)
  assert.match(bron, /WAT_WEET_DEZE_INDICATIE_NIET/)
})

test('ResultsView.jsx: primaire CTA na de indicatie is "Bespreek mijn resultaat met SMV"', () => {
  const bron = leesZonderComments('..', '..', 'components', 'energieIndicatie', 'ResultsView.jsx')
  assert.match(bron, /Bespreek mijn resultaat met SMV/)
})

test('ResultsView.jsx: bevat nergens meer result.totaleBesparing/co2 — ook niet verborgen in een href/mailto-attribuut', () => {
  // De mailto-conceptmail (buildGesprekMailto) staat als href gewoon in de
  // publieke pagina-HTML — zichtbaar via "pagina-bron bekijken", ook al
  // toont de knop alleen "Bespreek mijn resultaat met SMV". Een bedrag dat
  // we publiek verbergen mag dus ook daar niet in staan (indirecte route).
  const bron = leesZonderComments('..', '..', 'components', 'energieIndicatie', 'ResultsView.jsx')
  assert.equal(/totaleBesparing/.test(bron), false)
  assert.equal(/result\.co2\b/.test(bron), false)
  // Veldtoegang (bijv. `.besparingEuro` of `measure.terugverdientijd`), niet
  // een losse woordmatch — de disclaimertekst noemt "terugverdientijden"
  // juist bewust om uit te leggen wat er publiek NIET getoond wordt.
  assert.equal(/\.besparingEuro\b|\.investeringLaag\b|\.investeringHoog\b|\.terugverdientijd\b/.test(bron), false)
})

// --- Homepage-CTA's (Fase 6, sectie 6/7) -------------------------------------

test('Hero.jsx: primaire CTA is "Bespreek uw bedrijfspand", Energie Indicatie is secundair', () => {
  const bron = leesZonderComments('..', '..', 'components', 'home', 'Hero.jsx')
  const primaryIndex = bron.indexOf('Bespreek uw bedrijfspand')
  const secondaryIndex = bron.indexOf('Start de gratis energie-indicatie')
  assert.ok(primaryIndex > -1)
  assert.ok(secondaryIndex > -1)
  assert.ok(primaryIndex < secondaryIndex) // primaire knop staat vóór de secundaire in de bron
  assert.match(bron, /variant="outline"[^]*Start de gratis energie-indicatie/) // de secundaire knop is expliciet 'outline'
})

test('ClosingCta.jsx: primaire CTA is "Bespreek uw bedrijfspand", energie-indicatie is secundair/outline', () => {
  const bron = leesZonderComments('..', '..', 'components', 'home', 'ClosingCta.jsx')
  assert.match(bron, /Bespreek uw bedrijfspand/)
  assert.match(bron, /variant="outline"[^]*Start de gratis energie-indicatie/)
})

test('CTA-tekst voor de gratis tool is overal uniform "Start de gratis energie-indicatie"', () => {
  for (const bestand of [
    ['..', '..', 'components', 'home', 'EnergieCta.jsx'],
    ['..', '..', 'components', 'pakketten', 'DecisionCta.jsx'],
    ['..', '..', 'pages', 'Pakketten.jsx'],
  ]) {
    const bron = leesZonderComments(...bestand)
    assert.match(bron, /Start de gratis energie-indicatie/, bestand.join('/'))
  }
})
