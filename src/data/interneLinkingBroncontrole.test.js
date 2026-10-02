import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Websiteoptimalisatieronde (2026-10-02, masterprompt §17/§18): controleert
 * dat de twee blogposts die de audit als "nergens vanuit een niet-
 * blogpagina gelinkt" aanmerkte (energielabel C-verplichting — een
 * expliciet in de opdracht genoemd commercieel thema — en netcongestie,
 * sterk regionaal relevant) nu wél vanuit minstens één publieke
 * commerciële/informatieve pagina worden gelinkt, naast de blogindex zelf.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))
const PAGES_DIR = path.join(HIER, '..', 'pages')

function alleJsxInPages() {
  return readdirSync(PAGES_DIR)
    .filter((f) => f.endsWith('.jsx') && f !== 'Blog.jsx' && f !== 'BlogPost.jsx' && !f.startsWith('Admin'))
    .map((f) => readFileSync(path.join(PAGES_DIR, f), 'utf8'))
    .join('\n')
}

test('energielabel-c-verplicht-bedrijfspand wordt vanaf minstens één niet-blogpagina gelinkt', () => {
  assert.match(alleJsxInPages(), /blogPost\('energielabel-c-verplicht-bedrijfspand'\)/)
})

test('netcongestie-hoeksche-waard wordt vanaf minstens één niet-blogpagina gelinkt', () => {
  assert.match(alleJsxInPages(), /blogPost\('netcongestie-hoeksche-waard'\)/)
})

test('zonnepanelen-op-uw-bedrijfspand wordt ook vanaf Werkgebied.jsx gelinkt (niet alleen Pakketten.jsx)', () => {
  const bron = readFileSync(path.join(PAGES_DIR, 'Werkgebied.jsx'), 'utf8')
  assert.match(bron, /blogPost\('zonnepanelen-op-uw-bedrijfspand'\)/)
})

test('Werkwijze.jsx legt het verschil tussen MJOP en verduurzamingsadvies uit, zonder een nieuwe MJOP-dienst te suggereren', () => {
  const bron = readFileSync(path.join(PAGES_DIR, 'Werkwijze.jsx'), 'utf8')
  assert.match(bron, /meerjarenonderhoudsplan \(MJOP\)/)
  assert.equal(/wij stellen (ook )?een MJOP op|SMV (biedt|levert) (een )?MJOP/i.test(bron), false)
})
