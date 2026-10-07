import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Broncontrole voor de "Meer informatie"-ronde (2026-10-07): een
 * secundaire knop per PricingCard die naar een uitgebreide, per-pakket
 * informatiesectie op /pakketten springt. Zelfde statische-broncontrole-
 * methode als elders in dit project (geen jsdom/React-rendertests) — zie
 * closingCtaBroncontrole.test.js voor hetzelfde patroon.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
}

const PRICING_CARD = lees('..', 'components', 'home', 'PricingCard.jsx')
const PAKKETTEN = lees('Pakketten.jsx')
const ROUTES = lees('..', 'lib', 'routes.js')
const MAIN_LAYOUT = lees('..', 'layouts', 'MainLayout.jsx')
const PACKAGE_DETAILS = lees('..', 'data', 'packageDetails.js')
const PACKAGES = lees('..', 'data', 'packages.js')

const PAKKET_IDS = ['basis', 'premium', 'gold']

test('routes.js: pakketAnchor() is de enige plek waar het anchor-pad wordt opgebouwd', () => {
  assert.match(ROUTES, /pakketAnchor: \(pakketId\) => `\/pakketten#pakket-\$\{pakketId\}`/)
})

test('PricingCard.jsx: toont "Meer informatie" en linkt via ROUTES.pakketAnchor(pkg.id), niet naar een losse/hardcoded anchor', () => {
  assert.match(PRICING_CARD, /import \{ ROUTES \} from '\.\.\/\.\.\/lib\/routes'/)
  assert.match(PRICING_CARD, /<Button to=\{ROUTES\.pakketAnchor\(pkg\.id\)\} variant="ghost" size="sm"/)
  assert.match(PRICING_CARD, />\s*Meer informatie\s*</)
  assert.equal(/#pakket-/.test(PRICING_CARD), false, 'anchor-pad hoort alleen in ROUTES.pakketAnchor() te staan, niet opnieuw hardcoded in PricingCard.jsx')
})

test('PricingCard.jsx: de bestaande primaire aanvraagknop (pkg.ctaTo/pkg.cta) blijft ongewijzigd naast de nieuwe knop staan', () => {
  assert.match(PRICING_CARD, /<Button to=\{pkg\.ctaTo\} variant=\{pkg\.featured \? 'primary' : 'outline'\} className="mt-8 w-full">/)
  assert.match(PRICING_CARD, /\{pkg\.cta\}/)
})

test('Pakketten.jsx: heeft per pakket een sectie met een op pkg.id gebaseerd anchor-id en een scroll-margin tegen de vaste header', () => {
  assert.match(PAKKETTEN, /id=\{`pakket-\$\{pkg\.id\}`\}/)
  assert.match(PAKKETTEN, /className="scroll-mt-24 rounded-2xl border border-border bg-white/)
})

test('Pakketten.jsx: rendert de uitgebreide secties vanuit PACKAGES + PACKAGE_DETAILS, geen tweede PACKAGES-array of hardcoded naam/prijs/features/cta', () => {
  assert.match(PAKKETTEN, /import \{ PACKAGES \} from '\.\.\/data\/packages'/)
  assert.match(PAKKETTEN, /import \{ PACKAGE_DETAILS \} from '\.\.\/data\/packageDetails'/)
  assert.match(PAKKETTEN, /PACKAGES\.map\(\(pkg\) => \{/)
  assert.match(PAKKETTEN, /const details = PACKAGE_DETAILS\[pkg\.id\]/)
  // Geen los pakket-object/array met een eigen name/price/features in deze pagina.
  assert.equal(/const PACKAGES = \[/.test(PAKKETTEN), false)
  assert.equal(/priceDisplay:\s*['"]/.test(PAKKETTEN), false)
})

test('Pakketten.jsx: elke uitgebreide sectie bevat "Voor wie", "Wat u ontvangt" en "Hoe het proces verloopt"', () => {
  assert.match(PAKKETTEN, /Voor wie/)
  assert.match(PAKKETTEN, /Wat u ontvangt/)
  assert.match(PAKKETTEN, /Hoe het proces verloopt/)
})

test('Pakketten.jsx: de bestaande ComparisonTable en de drie PricingCards blijven behouden (regressie)', () => {
  assert.match(PAKKETTEN, /<ComparisonTable \/>/)
  assert.match(PAKKETTEN, /<PricingCard key=\{pkg\.id\} pkg=\{pkg\} delay=\{index \* 80\} \/>/)
})

test('Pakketten.jsx: geen nieuwe routes toegevoegd — alleen anchors binnen de bestaande /pakketten-pagina', () => {
  assert.equal(/\/pakketten\/basis|\/pakketten\/premium|\/pakketten\/gold/.test(PAKKETTEN), false)
})

test('packageDetails.js: heeft voor elk bestaand pakket-id een entry met de drie verwachte velden', () => {
  PAKKET_IDS.forEach((id) => {
    assert.match(PACKAGE_DETAILS, new RegExp(`${id}: \\{`))
  })
  assert.match(PACKAGE_DETAILS, /voorWie:/)
  assert.match(PACKAGE_DETAILS, /watJeOntvangt: \[/)
  assert.match(PACKAGE_DETAILS, /hoeHetProcesVerloopt: \[/)
})

test('packageDetails.js: elk pakket-id in packages.js heeft een bijbehorende entry in PACKAGE_DETAILS (geen pakket zonder uitgebreide uitleg)', () => {
  const idsInPackages = [...PACKAGES.matchAll(/id: '(\w+)',/g)].map((m) => m[1])
  assert.ok(idsInPackages.length >= 3, 'kon de pakket-id\'s niet uit packages.js lezen')
  idsInPackages.forEach((id) => {
    assert.match(PACKAGE_DETAILS, new RegExp(`${id}: \\{`), `PACKAGE_DETAILS mist een entry voor pakket-id "${id}"`)
  })
})

test('packageDetails.js: geen overclaimende formuleringen (garantie op besparing/resultaat/subsidie, "wij regelen de subsidie", "wij voeren uit")', () => {
  const RISICOVOLLE_FRASEN = [
    /garandeert?\b/i,
    /gegarandeerde?\b/i,
    /wij regelen de subsidie/i,
    /wij voeren.*uit/i,
    /100% onafhankelijk/i,
  ]
  RISICOVOLLE_FRASEN.forEach((regex) => {
    assert.equal(regex.test(PACKAGE_DETAILS), false, `onverwachte risicovolle formulering gevonden: ${regex}`)
  })
  // Gold moet "ondersteuning"/"ondersteunt" gebruiken, niet "verzorgt de aanvraag namens de klant".
  assert.match(PACKAGE_DETAILS, /[Oo]ndersteun/)
  assert.equal(/verzorgt de aanvraag/i.test(PACKAGE_DETAILS), false)
})

test('MainLayout.jsx: het scroll-naar-boven-effect houdt rekening met location.hash in plaats van altijd naar (0,0) te scrollen', () => {
  assert.match(MAIN_LAYOUT, /const \{ pathname, hash \} = useLocation\(\)/)
  assert.match(MAIN_LAYOUT, /if \(hash\) \{/)
  assert.match(MAIN_LAYOUT, /document\.getElementById\(hash\.slice\(1\)\)/)
  assert.match(MAIN_LAYOUT, /\}, \[pathname, hash\]\)/)
  // De oude, hash-onbewuste variant (alleen pathname) mag niet zijn blijven staan.
  assert.equal(/\}, \[pathname\]\)/.test(MAIN_LAYOUT), false)
})

test('MainLayout.jsx: de retry-lus annuleert zichzelf bij een volgende effect-run (geen late scroll na snel wegnavigeren)', () => {
  assert.match(MAIN_LAYOUT, /let geannuleerd = false/)
  assert.match(MAIN_LAYOUT, /return \(\) => \{\s*geannuleerd = true/)
})
