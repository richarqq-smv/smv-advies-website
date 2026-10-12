import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * Broncontrole (statische source-grep) voor de implementatieronde
 * 2026-10-12, punt 4: het btw-veld bij Instellingen had géén validatie
 * vóór opslaan (alleen de niet-afdwingbare HTML `min`/`step`). Dit
 * hergebruikt de bestaande, al geteste `isGeldigBtwPercentage()` uit
 * kosten.js (zie kosten.test.js) i.p.v. een tweede, afwijkende regel.
 */
const adminInstellingenJsx = readFileSync('src/pages/AdminInstellingen.jsx', 'utf8')

test('AdminInstellingen.jsx: hergebruikt isGeldigBtwPercentage() uit kosten.js, geen eigen btw-validatieregel', () => {
  assert.match(adminInstellingenJsx, /import \{ isGeldigBtwPercentage \} from '\.\.\/lib\/klantOmgeving\/kosten\.js'/)
})

test('AdminInstellingen.jsx: opslaan() valideert het btw-percentage vóór de updateFactuurInstellingen-aanroep en stopt bij een ongeldige waarde', () => {
  const functieStart = adminInstellingenJsx.indexOf('async function opslaan')
  const functieDeel = adminInstellingenJsx.slice(functieStart, functieStart + 500)
  assert.match(functieDeel, /if \(!isGeldigBtwPercentage\(formulier\.standaardBtwPercentage\)\) \{/)
  assert.match(functieDeel, /setBtwFout\(/)
  assert.match(functieDeel, /return\s*\n\s*\}/)
  const updateIndex = functieDeel.indexOf('updateFactuurInstellingen(')
  const guardIndex = functieDeel.indexOf('isGeldigBtwPercentage(formulier.standaardBtwPercentage)')
  assert.ok(guardIndex < updateIndex, 'de validatie moet vóór de opslaan-aanroep staan')
})

test('AdminInstellingen.jsx: toont een Nederlandstalige foutmelding bij het btw-veld, toegankelijk via aria-describedby', () => {
  assert.match(adminInstellingenJsx, /id="inst-btw-fout"/)
  assert.match(adminInstellingenJsx, /aria-describedby=\{btwFout \? 'inst-btw-fout' : undefined\}/)
  assert.match(adminInstellingenJsx, /aria-invalid=\{btwFout \? 'true' : undefined\}/)
  assert.match(adminInstellingenJsx, /Vul een geldig btw-percentage in \(0 t\/m 100\)\./)
})
