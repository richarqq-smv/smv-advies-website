import { test } from 'node:test'
import assert from 'node:assert/strict'
import { beoordeelMaatregel, SUBSIDIE_STATUSSEN } from './subsidieEligibility.js'

// --- Jaar ---

test('jaar: onbekend uitvoeringsjaar geeft "niet voldoende gegevens", nooit een regel', () => {
  const r = beoordeelMaatregel({ maatregelKey: 'dakisolatie', specificatie: { oppervlakteM2: 120, technischeWaarde: 3.5 } })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.NIET_VOLDOENDE_GEGEVENS)
  assert.equal(r.regel, null)
  assert.ok(r.ontbrekendeGegevens.includes('Uitvoeringsjaar'))
})

test('jaar: 2027 (geen regelset vastgelegd) geeft "controle vereist", geen gok op 2026-tarieven', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'dakisolatie',
    specificatie: { uitvoeringsjaar: 2027, oppervlakteM2: 120, technischeWaarde: 3.5, meldcode: 'X', isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.CONTROLE_VEREIST)
  assert.equal(r.regel, null)
})

// --- Dak ---

test('dak: volledig geldig (jaar/oppervlakte/Rd/meldcode/bevestiging) -> van toepassing', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'dakisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 120, technischeWaarde: 3.5, meldcode: 'KA30327', isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.VAN_TOEPASSING)
  assert.equal(r.regel.maatregelKey, 'dakisolatie')
  assert.deepEqual(r.ontbrekendeGegevens, [])
})

test('dak: te weinig isolatie (Rd onder minimum) -> niet van toepassing, met reden', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'dakisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 120, technischeWaarde: 2.0, meldcode: 'KA30327', isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.NIET_VAN_TOEPASSING)
  assert.match(r.redenen[0], /niet aan de minimale eis voldoet/)
})

test('dak: ontbrekende oppervlakte -> niet voldoende gegevens', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'dakisolatie',
    specificatie: { uitvoeringsjaar: 2026, technischeWaarde: 3.5, meldcode: 'KA30327', isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.NIET_VOLDOENDE_GEGEVENS)
})

test('dak: ontbrekende technische waarde -> niet voldoende gegevens', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'dakisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 120, meldcode: 'KA30327', isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.NIET_VOLDOENDE_GEGEVENS)
})

test('dak: ontbrekende meldcode maar overige gegevens compleet -> waarschijnlijk van toepassing (niet "van toepassing")', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'dakisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 120, technischeWaarde: 3.5, isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.WAARSCHIJNLIJK_VAN_TOEPASSING)
  assert.ok(r.ontbrekendeGegevens.some((g) => g.includes('Meldcode')))
})

test('dak: boven een (voor dak onbekend) maximum heeft geen disqualificerend effect in eligibility — dat is een rekenkwestie, zie calculator', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'dakisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 5000, technischeWaarde: 3.5, meldcode: 'KA30327', isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.VAN_TOEPASSING)
})

test('dak: isolatie expliciet niet bevestigd ("nee") -> niet van toepassing, met reden ("dak vervangen" ≠ automatisch isolatie)', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'dakisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 120, technischeWaarde: 3.5, isolatieBevestigd: 'nee' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.NIET_VAN_TOEPASSING)
})

test('dak: isolatie onbekend (nog niet bevestigd door adviseur) -> controle vereist', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'dakisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 120, technischeWaarde: 3.5, meldcode: 'KA30327', isolatieBevestigd: 'onbekend' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.CONTROLE_VEREIST)
})

// --- Gevel (zelfde gevallen) ---

test('gevel: volledig geldig -> van toepassing', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'gevelisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 60, technischeWaarde: 3.5, meldcode: 'KA31000', isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.VAN_TOEPASSING)
})

test('gevel: te weinig isolatie -> niet van toepassing', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'gevelisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 60, technischeWaarde: 1.5, meldcode: 'KA31000', isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.NIET_VAN_TOEPASSING)
})

test('gevel: te weinig oppervlakte (onder het RVO-minimum van 10 m²) -> niet van toepassing', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'gevelisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 5, technischeWaarde: 3.5, meldcode: 'KA31000', isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.NIET_VAN_TOEPASSING)
  assert.match(r.redenen[0], /onder het minimum/)
})

test('gevel: boven maximum (170 m²) is geen disqualificatie in eligibility, wel gecapt in de berekening', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'gevelisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 240, technischeWaarde: 3.5, meldcode: 'KA31000', isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.VAN_TOEPASSING)
})

test('gevel: ontbrekende oppervlakte -> niet voldoende gegevens', () => {
  const r = beoordeelMaatregel({ maatregelKey: 'gevelisolatie', specificatie: { uitvoeringsjaar: 2026, technischeWaarde: 3.5, isolatieBevestigd: 'ja' } })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.NIET_VOLDOENDE_GEGEVENS)
})

test('gevel: ontbrekende technische waarde -> niet voldoende gegevens', () => {
  const r = beoordeelMaatregel({ maatregelKey: 'gevelisolatie', specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 60, isolatieBevestigd: 'ja' } })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.NIET_VOLDOENDE_GEGEVENS)
})

test('gevel: ontbrekende meldcode -> waarschijnlijk van toepassing', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'gevelisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 60, technischeWaarde: 3.5, isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.WAARSCHIJNLIJK_VAN_TOEPASSING)
})

// --- Vloer (uitbreidingsronde) ---

test('vloer: volledig geldig -> van toepassing, Rd-eis 3,5', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'vloerisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 30, technischeWaarde: 3.5, meldcode: 'KA18164', isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.VAN_TOEPASSING)
  assert.equal(r.regel.tariefPerM2Enkel, 5.5)
})

test('vloer: exact op het Rd-minimum (3,5) -> wel van toepassing (grensgeval: niet eronder)', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'vloerisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 30, technischeWaarde: 3.5, meldcode: 'X', isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.VAN_TOEPASSING)
})

test('vloer: net onder het Rd-minimum (3,49) -> niet van toepassing', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'vloerisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 30, technischeWaarde: 3.49, meldcode: 'X', isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.NIET_VAN_TOEPASSING)
})

test('vloer: ontbrekende meldcode -> waarschijnlijk van toepassing', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'vloerisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 30, technischeWaarde: 3.5, isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.WAARSCHIJNLIJK_VAN_TOEPASSING)
})

// --- Bodem (uitbreidingsronde) ---

test('bodem: volledig geldig -> van toepassing, eigen (lager) tarief dan vloer', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'bodemisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 30, technischeWaarde: 3.5, meldcode: 'KA18779', isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.VAN_TOEPASSING)
  assert.equal(r.regel.tariefPerM2Enkel, 3.0)
})

test('bodem: ontbrekende oppervlakte -> niet voldoende gegevens', () => {
  const r = beoordeelMaatregel({ maatregelKey: 'bodemisolatie', specificatie: { uitvoeringsjaar: 2026, technischeWaarde: 3.5, isolatieBevestigd: 'ja' } })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.NIET_VOLDOENDE_GEGEVENS)
})

// --- Glas (gerichte uitbreidingsronde: U-waarde-richting is tegengesteld aan Rd) ---

test('HR++ glas: volledig geldig (U-waarde onder maximum) -> van toepassing', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'glasHrpp',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 10, technischeWaarde: 1.1, meldcode: 'KA30612', isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.VAN_TOEPASSING)
  assert.equal(r.regel.tariefPerM2Enkel, 25)
})

test('HR++ glas: U-waarde exact op het maximum (1,2) -> nog wel van toepassing (grensgeval)', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'glasHrpp',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 10, technischeWaarde: 1.2, meldcode: 'X', isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.VAN_TOEPASSING)
})

test('HR++ glas: U-waarde net boven het maximum (1,21) -> niet van toepassing (bij glas is LAGER beter, dus hoger dan de eis faalt)', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'glasHrpp',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 10, technischeWaarde: 1.21, meldcode: 'X', isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.NIET_VAN_TOEPASSING)
  assert.match(r.redenen[0], /U-waarde/)
})

test('Triple glas: volledig geldig -> van toepassing, eigen (hoger) tarief dan HR++', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'glasTriple',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 10, technischeWaarde: 0.6, meldcode: 'KA30689', isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.VAN_TOEPASSING)
  assert.equal(r.regel.tariefPerM2Enkel, 111)
})

test('Triple glas: U-waarde boven het maximum (0,7) -> niet van toepassing', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'glasTriple',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 10, technischeWaarde: 0.8, meldcode: 'X', isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.NIET_VAN_TOEPASSING)
})

// --- Doelgroep (opdracht §2/§13: VvE/overig krijgen expliciet "controle vereist", geen SVVE/SVOH-tarief verzonnen) ---

test('doelgroep VvE -> controle vereist, ook als alle technische gegevens compleet zijn', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'dakisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 120, technischeWaarde: 3.5, meldcode: 'KA30327', isolatieBevestigd: 'ja', doelgroep: 'vve' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.CONTROLE_VEREIST)
  assert.match(r.redenen[0], /VvE/)
  assert.equal(r.regel, null) // geen SVVE-tarief verzonnen
})

test('doelgroep overig (verhuurder e.d.) -> controle vereist, geen SVOH-tarief verzonnen', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'dakisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 120, technischeWaarde: 3.5, meldcode: 'KA30327', isolatieBevestigd: 'ja', doelgroep: 'overig' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.CONTROLE_VEREIST)
  assert.equal(r.regel, null)
})

test('doelgroep zakelijk -> controle vereist met expliciete verwijzing naar EIA/MIA/Vamil, geen zakelijk ISDE-tarief verzonnen', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'dakisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 120, technischeWaarde: 3.5, meldcode: 'KA30327', isolatieBevestigd: 'ja', doelgroep: 'zakelijk' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.CONTROLE_VEREIST)
  assert.match(r.redenen[0], /EIA\/MIA\/Vamil/)
  assert.equal(r.regel, null)
})

test('doelgroep eigenaar_bewoner (standaard, ook impliciet) -> normale ISDE-beoordeling, geen controle vereist om deze reden', () => {
  const r = beoordeelMaatregel({
    maatregelKey: 'dakisolatie',
    specificatie: { uitvoeringsjaar: 2026, oppervlakteM2: 120, technischeWaarde: 3.5, meldcode: 'KA30327', isolatieBevestigd: 'ja' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.VAN_TOEPASSING)
})

// --- Geen input / lege specificatie ---

test('lege specificatie crasht niet en levert "niet voldoende gegevens"', () => {
  const r = beoordeelMaatregel({ maatregelKey: 'dakisolatie', specificatie: {} })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.NIET_VOLDOENDE_GEGEVENS)
  assert.ok(Array.isArray(r.ontbrekendeGegevens))
})

test('elke status heeft minimaal één feitelijke reden ("waarom", opdracht §38) — nooit een lege uitleg', () => {
  const gevallen = [
    {},
    { uitvoeringsjaar: 2027, oppervlakteM2: 1, technischeWaarde: 1, meldcode: 'X', isolatieBevestigd: 'ja' },
    { uitvoeringsjaar: 2026, oppervlakteM2: 120, technischeWaarde: 3.5, isolatieBevestigd: 'nee' },
    { uitvoeringsjaar: 2026, oppervlakteM2: 120, technischeWaarde: 3.5, meldcode: 'X', isolatieBevestigd: 'onbekend' },
  ]
  gevallen.forEach((specificatie) => {
    const r = beoordeelMaatregel({ maatregelKey: 'dakisolatie', specificatie })
    assert.ok(r.redenen.length > 0 && r.redenen[0].trim().length > 0)
  })
})
