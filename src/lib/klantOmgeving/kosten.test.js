import { test } from 'node:test'
import assert from 'node:assert/strict'
import { KOSTEN_CATEGORIEEN, berekenKostenBedragen, valideerKostenpost } from './kosten.js'

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
