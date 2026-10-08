import { test } from 'node:test'
import assert from 'node:assert/strict'
import { berekenSubsidieVoorMaatregel, berekenCombinatie } from './subsidieCalculator.js'
import { beoordeelMaatregel } from './subsidieEligibility.js'
import { beoordeelApparaatMaatregel } from './subsidieApparaatEligibility.js'

function eligDak({ oppervlakteM2 = 120, technischeWaarde = 3.5, meldcode = 'KA30327', isolatieBevestigd = 'ja', uitvoeringsjaar = 2026 } = {}) {
  return beoordeelMaatregel({ maatregelKey: 'dakisolatie', specificatie: { uitvoeringsjaar, oppervlakteM2, technischeWaarde, meldcode, isolatieBevestigd } })
}
function eligGevel({ oppervlakteM2 = 60, technischeWaarde = 3.5, meldcode = 'KA31000', isolatieBevestigd = 'ja', uitvoeringsjaar = 2026 } = {}) {
  return beoordeelMaatregel({ maatregelKey: 'gevelisolatie', specificatie: { uitvoeringsjaar, oppervlakteM2, technischeWaarde, meldcode, isolatieBevestigd } })
}

// --- Correcte berekening (enkele maatregel) ---

test('correcte berekening: 120 m² dak enkel tarief (€16,25/m²) = €1.950,00', () => {
  const r = berekenSubsidieVoorMaatregel({ eligibility: eligDak(), oppervlakteM2: 120, combinatieAantal: 1 })
  assert.equal(r.berekenbaar, true)
  assert.equal(r.tarief, 16.25)
  assert.equal(r.subsidiabelOppervlak, 120)
  assert.equal(r.bedrag, 1950)
  assert.ok(r.toelichtingRegels.some((t) => t.includes('120') && t.includes('16.25')))
})

test('correcte berekening: 60 m² gevel enkel tarief (€20,25/m²) = €1.215,00', () => {
  const r = berekenSubsidieVoorMaatregel({ eligibility: eligGevel(), oppervlakteM2: 60, combinatieAantal: 1 })
  assert.equal(r.berekenbaar, true)
  assert.equal(r.tarief, 20.25)
  assert.equal(r.bedrag, 1215)
})

// --- Maximum ---

test('maximum: gevel 240 m² geregistreerd wordt gecapt op het subsidiabele maximum van 170 m²', () => {
  const elig = eligGevel({ oppervlakteM2: 240 })
  const r = berekenSubsidieVoorMaatregel({ eligibility: elig, oppervlakteM2: 240, combinatieAantal: 1 })
  assert.equal(r.subsidiabelOppervlak, 170)
  assert.equal(r.bedrag, Math.round(170 * 20.25 * 100) / 100)
  assert.ok(r.toelichtingRegels.some((t) => t.includes('170') && t.includes('240')))
})

test('maximum: dak heeft geen bekend maximum, dus geen capping bij een grote oppervlakte', () => {
  const elig = eligDak({ oppervlakteM2: 5000 })
  const r = berekenSubsidieVoorMaatregel({ eligibility: elig, oppervlakteM2: 5000, combinatieAantal: 1 })
  assert.equal(r.subsidiabelOppervlak, 5000)
})

// --- Ontbrekende data: nooit een bedrag ---

test('ontbrekende data: "niet voldoende gegevens" levert nooit een berekenbaar bedrag', () => {
  const elig = beoordeelMaatregel({ maatregelKey: 'dakisolatie', specificatie: {} })
  const r = berekenSubsidieVoorMaatregel({ eligibility: elig, oppervlakteM2: null, combinatieAantal: 1 })
  assert.equal(r.berekenbaar, false)
  assert.equal(r.bedrag, null)
})

test('ontbrekende data: "controle vereist" levert nooit een berekenbaar bedrag', () => {
  const elig = beoordeelMaatregel({
    maatregelKey: 'dakisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 120, technischeWaarde: 3.5, meldcode: 'X', isolatieBevestigd: 'onbekend' },
  })
  const r = berekenSubsidieVoorMaatregel({ eligibility: elig, oppervlakteM2: 120, combinatieAantal: 1 })
  assert.equal(r.berekenbaar, false)
})

test('ontbrekende data: "niet van toepassing" levert nooit een berekenbaar bedrag', () => {
  const elig = eligDak({ technischeWaarde: 1.0 })
  const r = berekenSubsidieVoorMaatregel({ eligibility: elig, oppervlakteM2: 120, combinatieAantal: 1 })
  assert.equal(r.berekenbaar, false)
})

test('"waarschijnlijk van toepassing" (meldcode ontbreekt) is wél indicatief berekenbaar — het tarief/Rd/oppervlak staan vast, alleen de meldcode niet', () => {
  const elig = eligDak({ meldcode: null })
  const r = berekenSubsidieVoorMaatregel({ eligibility: elig, oppervlakteM2: 120, combinatieAantal: 1 })
  assert.equal(r.berekenbaar, true)
  assert.equal(r.bedrag, 1950)
})

// --- Combinatiebedrag ---

test('combinatie: alleen dak -> geen combinatie-effect, enkel tarief', () => {
  const c = berekenCombinatie([{ maatregelKey: 'dakisolatie', eligibility: eligDak(), oppervlakteM2: 120 }])
  assert.equal(c.combinatieVanToepassing, false)
  assert.equal(c.resultaten[0].tarief, 16.25)
})

test('combinatie: alleen gevel -> geen combinatie-effect, enkel tarief', () => {
  const c = berekenCombinatie([{ maatregelKey: 'gevelisolatie', eligibility: eligGevel(), oppervlakteM2: 60 }])
  assert.equal(c.combinatieVanToepassing, false)
  assert.equal(c.resultaten[0].tarief, 20.25)
})

test('combinatie: dak + gevel beide subsidiabel -> combinatietarief (verdubbeld) voor beide, en een totaalbedrag', () => {
  const c = berekenCombinatie([
    { maatregelKey: 'dakisolatie', eligibility: eligDak(), oppervlakteM2: 120 },
    { maatregelKey: 'gevelisolatie', eligibility: eligGevel(), oppervlakteM2: 60 },
  ])
  assert.equal(c.combinatieVanToepassing, true)
  assert.equal(c.combinatieAantal, 2)
  const dakResultaat = c.resultaten.find((r) => r.maatregelKey === 'dakisolatie')
  const gevelResultaat = c.resultaten.find((r) => r.maatregelKey === 'gevelisolatie')
  assert.equal(dakResultaat.tarief, 32.5)
  assert.equal(gevelResultaat.tarief, 40.5)
  assert.equal(dakResultaat.bedrag, 120 * 32.5)
  assert.equal(gevelResultaat.bedrag, 60 * 40.5)
  assert.equal(c.totaalBerekenbaar, true)
  assert.equal(c.totaalBedrag, 120 * 32.5 + 60 * 40.5)
})

test('combinatie: dak compleet maar gevel nog incompleet -> dak telt niet mee in combinatieAantal met de incomplete gevel, totaal niet berekenbaar', () => {
  const c = berekenCombinatie([
    { maatregelKey: 'dakisolatie', eligibility: eligDak(), oppervlakteM2: 120 },
    { maatregelKey: 'gevelisolatie', eligibility: beoordeelMaatregel({ maatregelKey: 'gevelisolatie', specificatie: {} }), oppervlakteM2: null },
  ])
  assert.equal(c.combinatieAantal, 1)
  assert.equal(c.combinatieVanToepassing, false)
  assert.equal(c.totaalBerekenbaar, false)
  assert.equal(c.totaalBedrag, null)
  const dakResultaat = c.resultaten.find((r) => r.maatregelKey === 'dakisolatie')
  assert.equal(dakResultaat.tarief, 16.25) // enkel tarief, want de gevel telt niet mee als die niet subsidiabel/berekenbaar is
})

// --- Combinatie-categorie bij glas (uitbreidingsronde) ---

function eligGlas(maatregelKey, { technischeWaarde = 1.0, meldcode = 'X', isolatieBevestigd = 'ja', uitvoeringsjaar = 2026, oppervlakteM2 = 10 } = {}) {
  return beoordeelMaatregel({ maatregelKey, specificatie: { uitvoeringsjaar, oppervlakteM2, technischeWaarde, meldcode, isolatieBevestigd } })
}

test('combinatie: HR++ glas + triple glas samen tellen NIET als combinatie met elkaar (zelfde combinatieCategorie "glas") — beide krijgen het enkele tarief', () => {
  const c = berekenCombinatie([
    { maatregelKey: 'glasHrpp', soort: 'isolatie', eligibility: eligGlas('glasHrpp'), oppervlakteM2: 10 },
    { maatregelKey: 'glasTriple', soort: 'isolatie', eligibility: eligGlas('glasTriple', { technischeWaarde: 0.5 }), oppervlakteM2: 10 },
  ])
  assert.equal(c.combinatieAantal, 1)
  assert.equal(c.combinatieVanToepassing, false)
  const hrpp = c.resultaten.find((r) => r.maatregelKey === 'glasHrpp')
  assert.equal(hrpp.tarief, 25) // enkel tarief, geen verdubbeling
})

test('combinatie: HR++ glas + dakisolatie tellen WEL als combinatie (verschillende categorie) — beide krijgen het combinatietarief', () => {
  const c = berekenCombinatie([
    { maatregelKey: 'glasHrpp', soort: 'isolatie', eligibility: eligGlas('glasHrpp'), oppervlakteM2: 10 },
    { maatregelKey: 'dakisolatie', soort: 'isolatie', eligibility: eligDak(), oppervlakteM2: 120 },
  ])
  assert.equal(c.combinatieAantal, 2)
  const hrpp = c.resultaten.find((r) => r.maatregelKey === 'glasHrpp')
  const dak = c.resultaten.find((r) => r.maatregelKey === 'dakisolatie')
  assert.equal(hrpp.tarief, 50) // combinatietarief
  assert.equal(dak.tarief, 32.5) // combinatietarief
})

// --- Apparaatmaatregelen (uitbreidingsronde) ---

function eligWarmtepomp({ meldcode = 'KA20994', bedrag = 1925, bronUrl = 'https://www.rvo.nl/meldcodes-warmtepompen/ka20994', isolatieBevestigd = 'ja', uitvoeringsjaar = 2026 } = {}) {
  return beoordeelApparaatMaatregel({ apparaatKey: 'warmtepomp_hybride', specificatie: { uitvoeringsjaar, isolatieBevestigd, meldcode, bedrag, bronUrl } })
}

test('apparaat: bedrag is het vaste, adviseur-ingevoerde bedrag — geen tariefberekening (geen tarief/oppervlakte)', () => {
  const c = berekenCombinatie([{ maatregelKey: 'warmtepomp_hybride', soort: 'apparaat', eligibility: eligWarmtepomp(), bedrag: 1925 }])
  const r = c.resultaten[0]
  assert.equal(r.berekenbaar, true)
  assert.equal(r.bedrag, 1925)
  assert.equal(r.tarief, null)
  assert.equal(r.subsidiabelOppervlak, null)
})

test('apparaat zonder bedrag ingevuld -> niet berekenbaar, geen gegokt bedrag', () => {
  const c = berekenCombinatie([{ maatregelKey: 'warmtepomp_hybride', soort: 'apparaat', eligibility: eligWarmtepomp(), bedrag: null }])
  assert.equal(c.resultaten[0].berekenbaar, false)
  assert.equal(c.resultaten[0].bedrag, null)
})

test('combinatie: dakisolatie + warmtepomp -> allebei tellen mee in combinatieAantal, dak krijgt het combinatietarief, het warmtepompbedrag zelf blijft het vaste, niet-verdubbelde bedrag', () => {
  const c = berekenCombinatie([
    { maatregelKey: 'dakisolatie', soort: 'isolatie', eligibility: eligDak(), oppervlakteM2: 120 },
    { maatregelKey: 'warmtepomp_hybride', soort: 'apparaat', eligibility: eligWarmtepomp(), bedrag: 1925 },
  ])
  assert.equal(c.combinatieAantal, 2)
  assert.equal(c.combinatieVanToepassing, true)
  const dak = c.resultaten.find((r) => r.maatregelKey === 'dakisolatie')
  const wp = c.resultaten.find((r) => r.maatregelKey === 'warmtepomp_hybride')
  assert.equal(dak.tarief, 32.5) // combinatietarief, want warmtepomp telt mee
  assert.equal(wp.bedrag, 1925) // het apparaatbedrag zelf wordt nooit verdubbeld
  assert.equal(c.totaalBerekenbaar, true)
  assert.equal(c.totaalBedrag, 120 * 32.5 + 1925)
})
