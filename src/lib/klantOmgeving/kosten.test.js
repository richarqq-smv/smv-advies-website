import { test } from 'node:test'
import assert from 'node:assert/strict'
import { KOSTEN_CATEGORIEEN, BTW_PERCENTAGE_OPTIES, berekenKostenBedragen, valideerKostenpost, isGeldigBtwPercentage } from './kosten.js'

test('KOSTEN_CATEGORIEEN bevat de zeven vaste categorieën', () => {
  assert.deepEqual(
    KOSTEN_CATEGORIEEN.map((c) => c.id),
    ['kantoor', 'reiskosten', 'software', 'marketing', 'verzekering', 'opleiding', 'overig'],
  )
})

test('berekenKostenBedragen: standaardberekening met 21% btw', () => {
  const bedragen = berekenKostenBedragen({ bedragExclBtw: 100, btwPercentage: 21 })
  assert.equal(bedragen.btwBedrag, 21)
  assert.equal(bedragen.totaalInclBtw, 121)
})

test('berekenKostenBedragen: 0% btw geeft geen btw-bedrag', () => {
  const bedragen = berekenKostenBedragen({ bedragExclBtw: 50, btwPercentage: 0 })
  assert.equal(bedragen.btwBedrag, 0)
  assert.equal(bedragen.totaalInclBtw, 50)
})

test('valideerKostenpost: volledige, geldige kostenpost wordt geaccepteerd', () => {
  const fouten = valideerKostenpost({
    leverancier: 'KPN',
    omschrijving: 'Telefoonabonnement',
    categorie: 'kantoor',
    datum: '2026-09-28',
    bedragExclBtw: 50,
    btwPercentage: 21,
  })
  assert.deepEqual(fouten, {})
})

test('valideerKostenpost: ontbrekende verplichte velden worden geweigerd', () => {
  const fouten = valideerKostenpost({})
  assert.ok(fouten.leverancier)
  assert.ok(fouten.omschrijving)
  assert.ok(fouten.categorie)
  assert.ok(fouten.datum)
  assert.ok(fouten.bedragExclBtw)
  assert.ok(fouten.btwPercentage)
})

// Admin-UX-ronde (2026-10-09, UX-auditrapport §5): btw-percentage moet een
// eindige, niet-negatieve waarde binnen een logisch bereik (0-100) zijn —
// geen NaN, geen Infinity, geen tikfout als "210" i.p.v. "21".
test('isGeldigBtwPercentage: de drie standaardtarieven en 100 zijn geldig', () => {
  assert.equal(isGeldigBtwPercentage(0), true)
  assert.equal(isGeldigBtwPercentage(9), true)
  assert.equal(isGeldigBtwPercentage(21), true)
  assert.equal(isGeldigBtwPercentage(100), true)
})

test('isGeldigBtwPercentage: negatief, NaN, Infinity en boven de bovengrens zijn ongeldig', () => {
  assert.equal(isGeldigBtwPercentage(-1), false)
  assert.equal(isGeldigBtwPercentage(NaN), false)
  assert.equal(isGeldigBtwPercentage(Infinity), false)
  assert.equal(isGeldigBtwPercentage(-Infinity), false)
  assert.equal(isGeldigBtwPercentage(101), false)
  assert.equal(isGeldigBtwPercentage(210), false)
})

test('isGeldigBtwPercentage: niet-numerieke of lege invoer is ongeldig (geen stilzwijgende 0)', () => {
  assert.equal(isGeldigBtwPercentage(''), false)
  assert.equal(isGeldigBtwPercentage('abc'), false)
  assert.equal(isGeldigBtwPercentage(undefined), false)
  assert.equal(isGeldigBtwPercentage(null), false)
})

test('isGeldigBtwPercentage: numerieke string wordt net als het bedragveld geaccepteerd (formulierinvoer is altijd string)', () => {
  assert.equal(isGeldigBtwPercentage('21'), true)
  assert.equal(isGeldigBtwPercentage('9.5'), true)
})

test('BTW_PERCENTAGE_OPTIES bevat exact de drie Nederlandse tarieven, in volgorde', () => {
  assert.deepEqual(BTW_PERCENTAGE_OPTIES, [0, 9, 21])
})

test('valideerKostenpost: een tikfout als 210% wordt geweigerd, niet stilzwijgend geaccepteerd', () => {
  const fouten = valideerKostenpost({
    leverancier: 'X',
    omschrijving: 'Y',
    categorie: 'kantoor',
    datum: '2026-09-28',
    bedragExclBtw: 10,
    btwPercentage: 210,
  })
  assert.ok(fouten.btwPercentage)
})

test('valideerKostenpost: een niet-eindig bedrag (NaN/Infinity) wordt geweigerd', () => {
  assert.ok(valideerKostenpost({ leverancier: 'X', omschrijving: 'Y', categorie: 'kantoor', datum: '2026-09-28', bedragExclBtw: NaN, btwPercentage: 21 }).bedragExclBtw)
  assert.ok(valideerKostenpost({ leverancier: 'X', omschrijving: 'Y', categorie: 'kantoor', datum: '2026-09-28', bedragExclBtw: Infinity, btwPercentage: 21 }).bedragExclBtw)
})

test('valideerKostenpost: onbekende categorie wordt geweigerd', () => {
  const fouten = valideerKostenpost({
    leverancier: 'X',
    omschrijving: 'Y',
    categorie: 'iets-verzonnens',
    datum: '2026-09-28',
    bedragExclBtw: 10,
    btwPercentage: 21,
  })
  assert.ok(fouten.categorie)
})
