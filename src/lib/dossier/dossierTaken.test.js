import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bouwStandaardTaken, sorteerTaken, groepeerTakenPerCategorie } from './dossierTaken.js'

test('bouwStandaardTaken: subsidie levert exact de 3 stappen uit de Gold-template, in volgorde', () => {
  const taken = bouwStandaardTaken('subsidie')
  assert.equal(taken.length, 3)
  assert.match(taken[0].omschrijving, /EIA-melding/)
  assert.match(taken[1].omschrijving, /ISDE-aanvraag/)
  assert.match(taken[2].omschrijving, /Nacalculatie/)
  assert.equal(taken[0].verantwoordelijke, 'SMV Advies')
  assert.equal(taken[2].verantwoordelijke, 'Klant + SMV Advies')
  assert.deepEqual(taken.map((t) => t.volgorde), [0, 1, 2])
  taken.forEach((t) => assert.equal(t.categorie, 'subsidie'))
})

test('bouwStandaardTaken: oplevering levert exact de 5 items uit de Gold-template', () => {
  const taken = bouwStandaardTaken('oplevering')
  assert.equal(taken.length, 5)
  assert.match(taken[0].omschrijving, /Eindcontrole/)
  assert.match(taken[4].omschrijving, /Nazorgmoment/)
  taken.forEach((t) => assert.equal(t.categorie, 'oplevering'))
})

test('bouwStandaardTaken: onbekende categorie geeft lege lijst, nooit een crash', () => {
  assert.deepEqual(bouwStandaardTaken('onbekend'), [])
  assert.deepEqual(bouwStandaardTaken(undefined), [])
})

test('sorteerTaken: sorteert op volgorde', () => {
  const taken = [
    { volgorde: 2, created_at: '2026-01-01' },
    { volgorde: 0, created_at: '2026-01-02' },
    { volgorde: 1, created_at: '2026-01-03' },
  ]
  assert.deepEqual(sorteerTaken(taken).map((t) => t.volgorde), [0, 1, 2])
})

test('sorteerTaken: gelijke volgorde valt terug op created_at', () => {
  const taken = [
    { volgorde: 0, created_at: '2026-01-02' },
    { volgorde: 0, created_at: '2026-01-01' },
  ]
  assert.deepEqual(sorteerTaken(taken).map((t) => t.created_at), ['2026-01-01', '2026-01-02'])
})

test('groepeerTakenPerCategorie: splitst een platte lijst correct, negeert onbekende categorieën', () => {
  const taken = [
    { categorie: 'subsidie', volgorde: 1, created_at: '2026-01-01' },
    { categorie: 'oplevering', volgorde: 0, created_at: '2026-01-01' },
    { categorie: 'subsidie', volgorde: 0, created_at: '2026-01-01' },
    { categorie: 'iets_anders', volgorde: 0, created_at: '2026-01-01' },
  ]
  const groepen = groepeerTakenPerCategorie(taken)
  assert.equal(groepen.subsidie.length, 2)
  assert.equal(groepen.oplevering.length, 1)
  assert.equal(groepen.subsidie[0].volgorde, 0)
})

test('groepeerTakenPerCategorie: lege input geeft lege groepen, nooit een crash', () => {
  const groepen = groepeerTakenPerCategorie([])
  assert.deepEqual(groepen.subsidie, [])
  assert.deepEqual(groepen.oplevering, [])
})
