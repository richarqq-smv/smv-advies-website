import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * ClosingCta.jsx stond tot de websiteoptimalisatieronde (2026-10-02)
 * woordelijk identiek op 6 pagina's — zie de audit (sectie E/K.5). Deze
 * test controleert dat (a) het component nu optionele heading/description
 * props accepteert met de oorspronkelijke tekst als default (geen breaking
 * change), en (b) elke pagina die ClosingCta gebruikt een eigen, niet-
 * identieke kop meegeeft — behalve Home, die bewust de default (eerste,
 * generieke instap-CTA van de site) behoudt.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
}

test('ClosingCta.jsx: heading/description zijn optioneel met de oorspronkelijke tekst als default', () => {
  const bron = lees('ClosingCta.jsx')
  assert.match(bron, /heading = 'Klaar voor de eerste stap\?'/)
  assert.match(bron, /Bespreek vrijblijvend uw bedrijfspand, of doe eerst de gratis energie-indicatie/)
})

test('Pagina-eigen ClosingCta-koppen zijn uniek over de 5 niet-Home-pagina\'s (geen herhaling van dezelfde kop)', () => {
  const paginas = ['Over', 'Werkwijze', 'Werkgebied', 'Cases', 'Faq']
  const koppen = paginas.map((p) => {
    const bron = lees('..', '..', 'pages', `${p}.jsx`)
    const match = bron.match(/<ClosingCta\s+heading="([^"]+)"/)
    assert.ok(match, `${p}.jsx geeft geen eigen heading mee aan ClosingCta`)
    return match[1]
  })
  assert.equal(new Set(koppen).size, koppen.length, 'twee of meer pagina\'s gebruiken dezelfde ClosingCta-kop')
  assert.equal(koppen.includes('Klaar voor de eerste stap?'), false, 'een subpagina hergebruikt nog de oude generieke kop')
})

test('Home.jsx gebruikt bewust de default ClosingCta zonder eigen heading-prop', () => {
  const bron = lees('..', '..', 'pages', 'Home.jsx')
  assert.match(bron, /<ClosingCta \/>/)
})

/**
 * Regressietest voor een bug die tijdens deze ronde zelf aan het licht kwam:
 * bij `sm:flex-row` (640px) past een langere kop + de twee knoppen
 * (samen >500px, `shrink-0`) niet meer naast elkaar vanaf tablet-breedte —
 * de tekstkolom werd dan tot een paar tientallen pixels geperst en brak
 * woorden middenin af (live gemeten op 768px: scrollWidth 792 i.p.v. 768).
 * `lg:` voorkomt dit structureel, ongeacht hoe lang heading/description zijn.
 */
test('ClosingCta.jsx: rij-layout schakelt pas in bij lg: (1024px), niet bij sm: (640px) — voorkomt het afbreken van woorden bij een lange kop op tabletbreedte', () => {
  const bron = lees('ClosingCta.jsx')
  assert.match(bron, /flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between/)
  assert.equal(/sm:flex-row/.test(bron), false)
})
