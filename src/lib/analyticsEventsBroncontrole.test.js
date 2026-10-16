import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Broncontrole voor de meetbaarheidsronde (2026-10-16, conversieoptimalisatie-
 * fase): GA4-events via lib/analytics.js' trackEvent() op de primaire CTA's,
 * het starten/voltooien van de energie-indicatie, en het verzenden van het
 * contactformulier. Controleert zowel aanwezigheid (elke genoemde plek roept
 * trackEvent aan) als privacy (geen enkele aanroep geeft formulierinhoud of
 * persoonsgegevens mee als eventdata — alleen vaste, niet-herleidbare
 * strings zoals 'cta'/'location').
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
}

test('analytics.js: trackEvent() stuurt een gtag-event door en vangt een ontbrekende gtag af', () => {
  const bron = lees('analytics.js')
  assert.match(bron, /export function trackEvent\(name, params = \{\}\)/)
  assert.match(bron, /window\.gtag\('event', name, params\)/)
})

test('useEnergieScan.js: energiescan_gestart vuurt éénmalig bij het verlaten van stap 1 (geen formulierdata)', () => {
  const bron = lees('..', 'hooks', 'useEnergieScan.js')
  assert.match(bron, /import \{ trackEvent \} from '\.\.\/lib\/analytics'/)
  assert.match(bron, /gestartRef\.current = true/)
  assert.match(bron, /trackEvent\('energiescan_gestart'\)/)
})

test('useEnergieScan.js: energiescan_voltooid vuurt na een succesvolle berekening (geen formulierdata)', () => {
  const bron = lees('..', 'hooks', 'useEnergieScan.js')
  assert.match(bron, /dispatch\(\{ type: 'SUBMIT_SUCCESS', result \}\)[\s\S]{0,300}trackEvent\('energiescan_voltooid'\)/)
})

test('ContactForm.jsx: contact_form_verzonden vuurt na succesvolle verzending (geen formulierdata)', () => {
  const bron = lees('..', 'components', 'contact', 'ContactForm.jsx')
  assert.match(bron, /import \{ trackEvent \} from '\.\.\/\.\.\/lib\/analytics'/)
  assert.match(bron, /setStatus\('success'\)[\s\S]{0,300}trackEvent\('contact_form_verzonden'\)/)
})

const CTA_PLEKKEN = [
  { bestand: ['..', 'components', 'home', 'Hero.jsx'], locatie: 'hero', ctas: ['contact', 'energie_indicatie'] },
  { bestand: ['..', 'components', 'home', 'ClosingCta.jsx'], locatie: 'closing_cta', ctas: ['contact', 'energie_indicatie'] },
  { bestand: ['..', 'components', 'home', 'EnergieCta.jsx'], locatie: 'energie_cta', ctas: ['energie_indicatie'] },
  { bestand: ['..', 'components', 'pakketten', 'DecisionCta.jsx'], locatie: 'decision_cta', ctas: ['energie_indicatie', 'contact'] },
  { bestand: ['..', 'components', 'layout', 'StickyMobileActions.jsx'], locatie: 'sticky_mobile', ctas: ['energie_indicatie'] },
  { bestand: ['..', 'components', 'layout', 'Header.jsx'], locatie: 'header', ctas: ['contact'] },
]

for (const { bestand, locatie, ctas } of CTA_PLEKKEN) {
  test(`${bestand[bestand.length - 1]}: cta_click-events voor ${ctas.join('/')} op locatie '${locatie}'`, () => {
    const bron = lees(...bestand)
    assert.match(bron, /import \{ trackEvent \} from '.*lib\/analytics'/)
    for (const cta of ctas) {
      const regex = new RegExp(
        `trackEvent\\('cta_click', \\{ cta: '${cta}', location: '${locatie}' \\}\\)`,
      )
      assert.match(bron, regex, `${bestand.join('/')} mist cta_click voor cta='${cta}' location='${locatie}'`)
    }
  })
}

test('Geen enkele trackEvent-aanroep in de geraakte bestanden geeft formulierwaarden (values/state.values) mee als eventdata', () => {
  const bestanden = [
    ['..', 'hooks', 'useEnergieScan.js'],
    ['..', 'components', 'contact', 'ContactForm.jsx'],
    ...CTA_PLEKKEN.map((p) => p.bestand),
  ]
  for (const bestand of bestanden) {
    const bron = lees(...bestand)
    const aanroepen = bron.match(/trackEvent\([^)]*\)/g) ?? []
    for (const aanroep of aanroepen) {
      assert.equal(/values|state\.values|email|telefoon|naam|vraag/i.test(aanroep), false, `${bestand.join('/')}: ${aanroep} lijkt formulierdata mee te geven`)
    }
  }
})
