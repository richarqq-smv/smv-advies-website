import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Copy-audit (websiteoptimalisatieronde 2026-10-02, masterprompt §6/§33):
 * controleert dat een vaste lijst generieke marketingformuleringen niet
 * terugkomt op de publieke pagina's/componenten. Geen volledige
 * taalkwaliteitscontrole — alleen de specifieke, in de audit benoemde
 * clichés, zodat een toekomstige terugval hierop meteen opvalt.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(HIER, '..')

const VERBODEN_FRASES = ['toekomstbestendig', 'beide benen op de grond', 'Drie pakketten, één doel']

function alleBronbestanden(dir) {
  const resultaat = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const volledigPad = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      resultaat.push(...alleBronbestanden(volledigPad))
    } else if (/\.jsx?$/.test(entry.name) && !entry.name.endsWith('.test.js')) {
      resultaat.push(volledigPad)
    }
  }
  return resultaat
}

test('publieke broncode bevat geen van de in de audit benoemde marketingclichés meer', () => {
  const treffers = []
  for (const bestand of alleBronbestanden(SRC)) {
    // Admin-/klantomgeving vallen buiten de scope van deze websiteronde —
    // alleen publieke pagina's/componenten/data worden gecontroleerd.
    if (/[\\/](pages\/Admin|components\/admin|components\/klantOmgeving|lib\/klantOmgeving)/.test(bestand)) continue
    const bron = readFileSync(bestand, 'utf8')
    for (const frase of VERBODEN_FRASES) {
      if (bron.includes(frase)) treffers.push(`${path.relative(SRC, bestand)}: "${frase}"`)
    }
  }
  assert.deepEqual(treffers, [])
})
