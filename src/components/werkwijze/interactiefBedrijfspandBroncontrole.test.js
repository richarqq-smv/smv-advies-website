import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Broncontrole voor de interactieve bedrijfspand-illustratie (/werkwijze,
 * ronde 2026-10-15) — zelfde statische-broncontrole-methode als de andere
 * *Broncontrole.test.js-bestanden in dit project (geen jsdom/React-
 * testrunner beschikbaar).
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8')
}

const COMPONENT = lees('InteractiefBedrijfspand.jsx')
const WERKWIJZE = lees('..', '..', 'pages', 'Werkwijze.jsx')
const PROJECT_ROOT = path.join(HIER, '..', '..', '..')

test('bedrijfspand-interactief.png staat als publiek asset in de projectroot', () => {
  assert.ok(existsSync(path.join(PROJECT_ROOT, 'public', 'bedrijfspand-interactief.png')))
})

test('bedrijfspandHotspots.js: exact 24 hotspots, elk met verplichte velden en geldige x/y', async () => {
  const mod = await import('../../data/bedrijfspandHotspots.js')
  assert.equal(mod.BEDRIJFSPAND_HOTSPOTS.length, 24)

  const ids = new Set()
  for (const hotspot of mod.BEDRIJFSPAND_HOTSPOTS) {
    assert.ok(hotspot.id, 'hotspot mist id')
    assert.equal(ids.has(hotspot.id), false, `dubbel id: ${hotspot.id}`)
    ids.add(hotspot.id)
    assert.ok(hotspot.title, `${hotspot.id}: title ontbreekt`)
    assert.ok(hotspot.description, `${hotspot.id}: description ontbreekt`)
    assert.ok(
      mod.BEDRIJFSPAND_CATEGORIE_LABELS[hotspot.category],
      `${hotspot.id}: categorie "${hotspot.category}" heeft geen label`,
    )
    assert.ok(typeof hotspot.x === 'number' && hotspot.x >= 0 && hotspot.x <= 100, `${hotspot.id}: x moet een percentage zijn`)
    assert.ok(typeof hotspot.y === 'number' && hotspot.y >= 0 && hotspot.y <= 100, `${hotspot.id}: y moet een percentage zijn`)
    if (hotspot.link) {
      assert.ok(hotspot.link.to, `${hotspot.id}: link.to ontbreekt`)
      assert.ok(hotspot.link.label, `${hotspot.id}: link.label ontbreekt`)
    }
  }
})

test('InteractiefBedrijfspand.jsx: gebruikt de PNG, rendert 24 knoppen op basis van BEDRIJFSPAND_HOTSPOTS, en biedt een sluitbaar paneel', () => {
  assert.match(COMPONENT, /src="\/bedrijfspand-interactief\.png"/)
  assert.match(COMPONENT, /BEDRIJFSPAND_HOTSPOTS\.map\(\(hotspot\) => \{/)
  assert.match(COMPONENT, /type="button"/)
  assert.match(COMPONENT, /aria-pressed={actief}/)
  assert.match(COMPONENT, /aria-label="Paneel sluiten"/)
  assert.match(COMPONENT, /left: `\$\{hotspot\.x\}%`, top: `\$\{hotspot\.y\}%`/)
})

test('Werkwijze.jsx: integreert InteractiefBedrijfspand zonder bestaande content te verwijderen', () => {
  assert.match(WERKWIJZE, /import \{ InteractiefBedrijfspand \} from '\.\.\/components\/werkwijze\/InteractiefBedrijfspand'/)
  assert.match(WERKWIJZE, /<InteractiefBedrijfspand \/>/)
  // Bestaande secties moeten intact blijven.
  assert.match(WERKWIJZE, /Wat SMV Advies niet doet/)
  assert.match(WERKWIJZE, /Een rapport dat u écht gebruikt/)
  assert.match(WERKWIJZE, /<HowItWorks \/>/)
})
