import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { PACKAGES } from '../data/packages.js'

/**
 * Broncontrole voor de CRO-ronde op /pakketten (2026-10-23): eerste
 * vervolgstap in de hero, prijzen per oppervlakte uit de enige prijsbron,
 * meetbare pakket-CTA's en geen em dashes in de nieuwe publieke tekst.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
}

function zonderRegelcommentaar(bron) {
  return bron.replace(/^\s*\/\/.*$/gm, '')
}

const PAKKETTEN = lees('Pakketten.jsx')
const PRIJSTABEL = lees('..', 'components', 'pakketten', 'PrijsPerOppervlakte.jsx')
const PRICING_CARD = lees('..', 'components', 'home', 'PricingCard.jsx')

test('Pakketten.jsx: de hero linkt naar het pakkettenoverzicht, en dat anker bestaat op de pagina', () => {
  assert.match(PAKKETTEN, /const OVERZICHT_ID = 'pakketten-overzicht'/)
  assert.match(PAKKETTEN, /to=\{`\$\{ROUTES\.pakketten\}#\$\{OVERZICHT_ID\}`\}/)
  assert.match(PAKKETTEN, /<div id=\{OVERZICHT_ID\} className="scroll-mt-24">/)
})

test('PrijsPerOppervlakte.jsx: toont prijzen uitsluitend uit PACKAGES[].priceTiers, geen hardcoded bedragen', () => {
  assert.match(PRIJSTABEL, /pkg\.priceTiers\.find/)
  assert.equal(/€ ?\d/.test(PRIJSTABEL), false)
})

test('packages.js: alle pakketten gebruiken dezelfde oppervlaktecategorieën (de prijstabel leest de rijen uit het eerste pakket)', () => {
  const ids = (pkg) => pkg.priceTiers.map((t) => t.id).join(',')
  PACKAGES.forEach((pkg) => assert.equal(ids(pkg), ids(PACKAGES[0]), pkg.id))
})

test('PricingCard.jsx: de pakketknop meet een cta_click per pakket via de bestaande trackEvent()', () => {
  assert.match(PRICING_CARD, /trackEvent\('cta_click', \{ cta: `pakket_\$\{pkg\.id\}`, location: 'pricing_card' \}\)/)
})

test('Pakketten.jsx en PrijsPerOppervlakte.jsx: geen em dash in publieke tekst', () => {
  assert.equal(zonderRegelcommentaar(PAKKETTEN).includes('—'), false)
  assert.equal(zonderRegelcommentaar(PRIJSTABEL).includes('—'), false)
})

test('Inhoudelijke correcties (2026-10-23): FAQ, vergelijking en pakketkaart sluiten aan op de pakketdefinities', async () => {
  // faqs.js importeert zonder extensie (Vite), dus hier als brontekst gelezen.
  const FAQS = lees('..', 'data', 'faqs.js')
  const { COMPARISON_ROWS } = await import('../data/packageComparison.js')

  // QuickScan (Basis) is volgens packages.js op afstand, zonder locatiebezoek.
  assert.match(FAQS, /De QuickScan \(Basis Pakket\) gebeurt op afstand, zonder locatiebezoek/)
  // Gold kent één visuele opleveringscheck, geen eindafname/eindrapportage.
  assert.equal(/eindafname|eindrapportage/.test(FAQS), false)
  // Het maximum van 3 geldt voor de begeleiding, niet voor het maatregelenoverzicht.
  const gold = (label) => COMPARISON_ROWS.find((r) => r.label === label).values[2]
  assert.equal(gold('Maatregelenoverzicht'), 'Volledig (10), waarvan max. 3 met begeleiding')
  assert.equal(/financiering/i.test(gold('Financieel overzicht')), false)
  assert.ok(PACKAGES.find((p) => p.id === 'gold').features.includes('Begeleiding bij maximaal 3 geselecteerde maatregelen'))
})
