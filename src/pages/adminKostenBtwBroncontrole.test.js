import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * Broncontrole (statische source-grep) voor de UX-auditronde 2026-10-09,
 * feature 3: het btw-percentage bij Kosten wordt via een dropdown
 * (0/9/21/Anders) gekozen i.p.v. een vrij invoerveld, en de standaardwaarde
 * komt uit de Administratie-instelling i.p.v. een hardcoded "21". Zie ook
 * de pure-logicatests in kosten.test.js (isGeldigBtwPercentage).
 */
const adminKostenJsx = readFileSync('src/pages/AdminKosten.jsx', 'utf8')

test('AdminKosten.jsx: het btw-veld is een dropdown met de drie standaardtarieven plus "Anders", geen vrij invoerveld', () => {
  assert.match(adminKostenJsx, /<select id="kosten-btw"/)
  assert.match(adminKostenJsx, /BTW_PERCENTAGE_OPTIES\.map/)
  assert.match(adminKostenJsx, /<option value="anders">Anders\.\.\.<\/option>/)
})

test('AdminKosten.jsx: "Anders" toont een los, apart gevalideerd invoerveld (max 100)', () => {
  assert.match(adminKostenJsx, /formulier\.btwKeuze === 'anders'/)
  assert.match(adminKostenJsx, /id="kosten-btw-anders"/)
  assert.match(adminKostenJsx, /max="100"/)
})

test('AdminKosten.jsx: de standaardwaarde komt uit getFactuurInstellingen() (standaard_btw_percentage), nooit een hardcoded "21"', () => {
  assert.match(adminKostenJsx, /import \{ adminListKosten, createKostenpost, updateKostenpostStatus, verwijderKostenpost, getFactuurInstellingen \}/)
  assert.match(adminKostenJsx, /instellingen\?\.standaard_btw_percentage/)
  assert.doesNotMatch(adminKostenJsx, /btwPercentage: '21'/)
})

test('AdminKosten.jsx: een mislukte instellingen-fetch valt NIET stilzwijgend terug op een hardcoded standaard — de gebruiker ziet een expliciete melding en kiest zelf', () => {
  const effectStart = adminKostenJsx.indexOf('getFactuurInstellingen()\n')
  const effectDeel = adminKostenJsx.slice(effectStart, effectStart + 700)
  assert.match(effectDeel, /\.catch\(/)
  assert.match(effectDeel, /setStandaardBtwStatus\('fout'\)/)
  assert.match(adminKostenJsx, /Standaard btw-percentage kon niet worden geladen — kies hier handmatig een percentage\./)
})

test('AdminKosten.jsx: leegFormulier() zonder bekende standaard laat btwKeuze bewust leeg (geen gegokte waarde)', () => {
  const functieStart = adminKostenJsx.indexOf('function leegFormulier')
  const functieDeel = adminKostenJsx.slice(functieStart, functieStart + 1200)
  assert.match(functieDeel, /standaardBtw != null \? 'anders' : ''/)
})

test('AdminKosten.jsx: voegToe() valideert het daadwerkelijke (afgeleide) btw-percentage, niet de ruwe dropdown-waarde', () => {
  const functieStart = adminKostenJsx.indexOf('async function voegToe')
  const functieDeel = adminKostenJsx.slice(functieStart, functieStart + 600)
  assert.match(functieDeel, /btwPercentageVanFormulier\(formulier\)/)
  assert.match(functieDeel, /valideerKostenpost\(\{ \.\.\.formulier, btwPercentage: btwPercentageRuw \}\)/)
})
