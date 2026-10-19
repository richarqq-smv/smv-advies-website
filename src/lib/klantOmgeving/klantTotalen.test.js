import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bouwKlantTotalen } from './klantTotalen.js'

function dossierMet(resultaat) {
  return { energie_snapshot: resultaat ? { resultaat } : null }
}

test('bouwKlantTotalen: geen dossiers → null', () => {
  assert.equal(bouwKlantTotalen([]), null)
  assert.equal(bouwKlantTotalen(undefined), null)
})

test('bouwKlantTotalen: geen van de dossiers heeft een Energie-indicatie → null, geen schatting', () => {
  const dossiers = [dossierMet(null), { energie_snapshot: null }, {}]
  assert.equal(bouwKlantTotalen(dossiers), null)
})

test('bouwKlantTotalen: telt besparing en CO2 op over meerdere dossiers', () => {
  const dossiers = [
    dossierMet({ huidigeKosten: 1000, totaleBesparing: 300, co2: 250 }),
    dossierMet({ huidigeKosten: 2000, totaleBesparing: 450.6, co2: 600 }),
  ]
  const totalen = bouwKlantTotalen(dossiers)
  assert.equal(totalen.besparingPerJaar, 300 + 451)
  assert.equal(totalen.co2PerJaar, 250 + 600)
  assert.equal(totalen.aantalDossiers, 2)
})

test('bouwKlantTotalen: een dossier zonder CO2-cijfer telt niet mee in de CO2-som, maar blokkeert de besparingssom niet', () => {
  const dossiers = [
    dossierMet({ huidigeKosten: 1000, totaleBesparing: 300, co2: null }),
    dossierMet({ huidigeKosten: 2000, totaleBesparing: 450, co2: 600 }),
  ]
  const totalen = bouwKlantTotalen(dossiers)
  assert.equal(totalen.besparingPerJaar, 750)
  assert.equal(totalen.co2PerJaar, 600)
})

test('bouwKlantTotalen: een dossier zonder Energie-indicatie telt simpelweg niet mee naast dossiers die wel data hebben', () => {
  const dossiers = [dossierMet(null), dossierMet({ huidigeKosten: 1000, totaleBesparing: 200, co2: 150 })]
  const totalen = bouwKlantTotalen(dossiers)
  assert.equal(totalen.besparingPerJaar, 200)
  assert.equal(totalen.co2PerJaar, 150)
  assert.equal(totalen.aantalDossiers, 1)
})

test('correctieronde — een dossier met een onbruikbare/ontbrekende totaleBesparing telt NIET mee als € 0, maar wordt simpelweg uitgesloten van de som', () => {
  const dossiers = [
    dossierMet({ huidigeKosten: 1000 }), // totaleBesparing ontbreekt
    dossierMet({ huidigeKosten: 2000, totaleBesparing: NaN, co2: 600 }),
    dossierMet({ huidigeKosten: 3000, totaleBesparing: 500, co2: 200 }),
  ]
  const totalen = bouwKlantTotalen(dossiers)
  assert.equal(totalen.besparingPerJaar, 500)
  assert.equal(totalen.aantalDossiers, 1)
})
