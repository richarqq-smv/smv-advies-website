import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { MEERWERK_UURTARIEF, bepaalPrijsTier } from './offerte.js'

/**
 * src/data/packages.js importeert zelf `from '../lib/routes'` zonder
 * extensie (net als calculations.js elders in dit project) — onoplosbaar
 * voor de kale Node-testrunner. `offerte.js` (met bepaalPrijsTier, al
 * uitgebreid getest met lokale fixtures in offerte.test.js) heeft zelf
 * geen enkele import en is dus wél veilig direct te importeren.
 *
 * Voor de commerciële waarheid uit packages.js/packageComparison.js zelf
 * (prijzen, Gold-scope) lezen we daarom de bronbestanden rechtstreeks —
 * zelfde patroon als de bron-controles in
 * lib/energieScan/publiekeOutputBroncontrole.test.js — zodat dit
 * daadwerkelijk het echte bestand test, niet alleen een losse fixture.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function leesDataBestand(naam) {
  return readFileSync(path.join(HIER, '..', '..', 'data', naam), 'utf8')
}

test('MEERWERK_UURTARIEF: is het afgesproken standaardtarief van € 95 per uur', () => {
  assert.equal(MEERWERK_UURTARIEF, 95)
})

// --- packages.js: prijzen per tier (Fase 6, commerciële waarheid) -----------

test('packages.js: Basis-prijzen zijn € 495 (tot 1.000 m²) en € 695 (1.000–2.500 m²)', () => {
  const bron = leesDataBestand('packages.js')
  const basisBlok = bron.slice(bron.indexOf("id: 'basis'"), bron.indexOf("id: 'premium'"))
  assert.match(basisBlok, /maxOppervlak: 1000, prijs: 495/)
  assert.match(basisBlok, /maxOppervlak: 2500, prijs: 695/)
  assert.match(basisBlok, /maxOppervlak: null, prijs: null/)
})

test('packages.js: Premium-prijzen zijn € 995 (tot 1.000 m²) en € 1.295 (1.000–2.500 m²)', () => {
  const bron = leesDataBestand('packages.js')
  const premiumBlok = bron.slice(bron.indexOf("id: 'premium'"), bron.indexOf("id: 'gold'"))
  assert.match(premiumBlok, /maxOppervlak: 1000, prijs: 995/)
  assert.match(premiumBlok, /maxOppervlak: 2500, prijs: 1295/)
  assert.match(premiumBlok, /maxOppervlak: null, prijs: null/)
})

test('packages.js: Gold-prijzen zijn € 2.495 (tot 1.000 m²) en € 2.995 (1.000–2.500 m²)', () => {
  const bron = leesDataBestand('packages.js')
  const goldBlok = bron.slice(bron.indexOf("id: 'gold'"))
  assert.match(goldBlok, /maxOppervlak: 1000, prijs: 2495/)
  assert.match(goldBlok, /maxOppervlak: 2500, prijs: 2995/)
  assert.match(goldBlok, /maxOppervlak: null, prijs: null/)
})

// --- Uitputtende grenswaarde-tests per pakket (Fase 6 mega-eindcontrole) ----
//
// bepaalPrijsTier() zelf is al grondig grensgetest in offerte.test.js met
// een generieke fixture; dit test diezelfde grenzen expliciet tégen de drie
// ECHTE commerciële prijzen van Basis/Premium/Gold (hierboven via
// bron-controle bevestigd dat packages.js deze exacte tiers bevat), zodat
// een toekomstige prijswijziging die de brontekst-check laat slagen maar de
// tier-logica breekt (bijv. verkeerde volgorde) hier alsnog wordt gevangen.
function tiersVoor(prijsLaag, prijsHoog) {
  return [
    { id: 'tot-1000m2', label: 'Tot 1.000 m²', maxOppervlak: 1000, prijs: prijsLaag },
    { id: '1000-2500m2', label: '1.000 – 2.500 m²', maxOppervlak: 2500, prijs: prijsHoog },
    { id: 'op-aanvraag', label: 'Groter of complexer pand', maxOppervlak: null, prijs: null },
  ]
}

const ECHTE_PRIJZEN = {
  basis: tiersVoor(495, 695),
  premium: tiersVoor(995, 1295),
  gold: tiersVoor(2495, 2995),
}

for (const [pakketId, priceTiers] of Object.entries(ECHTE_PRIJZEN)) {
  const pakket = { id: pakketId, priceTiers }

  test(`bepaalPrijsTier (${pakketId}): 0 m² en een klein oppervlak (bijv. 50 m²) horen bij de eerste tier`, () => {
    assert.equal(bepaalPrijsTier(pakket, 0).prijs, priceTiers[0].prijs)
    assert.equal(bepaalPrijsTier(pakket, 50).prijs, priceTiers[0].prijs)
  })

  test(`bepaalPrijsTier (${pakketId}): exact 1.000 m² hoort nog bij "tot 1.000 m²"`, () => {
    assert.equal(bepaalPrijsTier(pakket, 1000).prijs, priceTiers[0].prijs)
  })

  test(`bepaalPrijsTier (${pakketId}): net boven 1.000 m² (1000,01 en 1001) hoort al bij de tweede tier`, () => {
    assert.equal(bepaalPrijsTier(pakket, 1000.01).prijs, priceTiers[1].prijs)
    assert.equal(bepaalPrijsTier(pakket, 1001).prijs, priceTiers[1].prijs)
  })

  test(`bepaalPrijsTier (${pakketId}): exact 2.500 m² hoort nog bij de tweede tier`, () => {
    assert.equal(bepaalPrijsTier(pakket, 2500).prijs, priceTiers[1].prijs)
  })

  test(`bepaalPrijsTier (${pakketId}): net boven 2.500 m² (2500,01 en 2501) valt op "op aanvraag" — geen bedrag verzonnen`, () => {
    assert.equal(bepaalPrijsTier(pakket, 2500.01).prijs, null)
    assert.equal(bepaalPrijsTier(pakket, 2501).prijs, null)
  })

  test(`bepaalPrijsTier (${pakketId}): geen enkel oppervlak valt tussen twee tiers in of buiten alle tiers (geen gat)`, () => {
    for (const opp of [0, 1, 500, 999, 999.99, 1000, 1000.01, 1001, 1500, 2499, 2499.99, 2500, 2500.01, 2501, 10000, null]) {
      const tier = bepaalPrijsTier(pakket, opp)
      assert.ok(tier, `geen tier gevonden voor oppervlakte ${opp}`)
      assert.ok(priceTiers.includes(tier), `tier voor ${opp} is geen van de drie gedefinieerde tiers`)
    }
  })
}

// --- Gold-scope: expliciete grenzen moeten daadwerkelijk in de features staan ---

test('Gold-pakket: scope vermeldt het maximum van 3 geselecteerde maatregelen', () => {
  const goldBlok = leesDataBestand('packages.js').slice(leesDataBestand('packages.js').indexOf("id: 'gold'"))
  assert.match(goldBlok, /[Mm]aximaal 3 geselecteerde maatregelen/)
})

test('Gold-pakket: scope vermeldt maximaal 3 aanbieders per maatregel en 1 offerteronde', () => {
  const goldBlok = leesDataBestand('packages.js').slice(leesDataBestand('packages.js').indexOf("id: 'gold'"))
  assert.match(goldBlok, /maximaal 3 aanbieders/i)
  assert.match(goldBlok, /1 offerteronde/i)
})

test('Gold-pakket: scope vermeldt 3 klantcontactmomenten en 1 startoverleg', () => {
  const goldBlok = leesDataBestand('packages.js').slice(leesDataBestand('packages.js').indexOf("id: 'gold'"))
  assert.match(goldBlok, /3 klantcontactmomenten/i)
  assert.match(goldBlok, /1 startoverleg/i)
})

test('Gold-pakket: scope vermeldt EIA/ISDE-ondersteuning', () => {
  const goldBlok = leesDataBestand('packages.js').slice(leesDataBestand('packages.js').indexOf("id: 'gold'"))
  assert.match(goldBlok, /EIA\/ISDE/i)
})

test('Gold-pakket: opleveringscheck is expliciet visueel en expliciet begrensd (geen technische keuring/garantie)', () => {
  const goldBlok = leesDataBestand('packages.js').slice(leesDataBestand('packages.js').indexOf("id: 'gold'"))
  assert.match(goldBlok, /visuele opleveringscheck/i)
  assert.match(goldBlok, /geen technische keuring/i)
  assert.match(goldBlok, /geen bouwkundige inspectie/i)
  assert.match(goldBlok, /geen garantie/i)
})

test('Gold-pakket: begeleiding is expliciet begrensd tot maximaal 12 maanden', () => {
  const goldBlok = leesDataBestand('packages.js').slice(leesDataBestand('packages.js').indexOf("id: 'gold'"))
  assert.match(goldBlok, /maximaal 12 maanden/i)
})

test('Gold-pakket: maakt expliciet dat werk buiten de scope meerwerk is, tegen het afgesproken uurtarief', () => {
  const goldBlok = leesDataBestand('packages.js').slice(leesDataBestand('packages.js').indexOf("id: 'gold'"))
  assert.match(goldBlok, /scopeNote/)
  assert.match(goldBlok, /meerwerk/i)
  assert.match(goldBlok, /MEERWERK_UURTARIEF/)
})

// --- packageComparison.js moet consistent zijn met de nieuwe Gold-scope ------

test('packageComparison.js: Gold-rij "Maatregelenoverzicht" claimt niet langer een onbegrensd "Volledig (10) + planning"', () => {
  const bron = leesDataBestand('packageComparison.js')
  const rijRegel = bron.split('\n').find((regel) => regel.includes('Maatregelenoverzicht'))
  assert.ok(rijRegel)
  assert.equal(rijRegel.includes('Volledig (10) + planning'), false)
  assert.match(rijRegel, /3/) // verwijst naar de nieuwe cap van 3 maatregelen
})
