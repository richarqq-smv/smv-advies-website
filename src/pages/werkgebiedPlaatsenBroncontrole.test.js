import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Broncontrole voor de dorpspagina's-ronde (2026-10-15): 10 eigen,
 * geïndexeerde pagina's per kern van de Hoeksche Waard (/:plaats), zelfde
 * statische-broncontrole-methode als de andere *Broncontrole.test.js-
 * bestanden in dit project (geen jsdom/React-testrunner beschikbaar).
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))

function lees(...relatievePad) {
  return readFileSync(path.join(HIER, ...relatievePad), 'utf8')
}

const WERKGEBIED_PLAATS = lees('WerkgebiedPlaats.jsx')
const WERKGEBIED = lees('Werkgebied.jsx')
const ROUTES_BRON = lees('..', 'lib', 'routes.js')
const APP_BRON = lees('..', 'App.jsx')
const PRERENDER = lees('..', '..', 'scripts', 'prerender.mjs')
const SITEMAP = lees('..', '..', 'public', 'sitemap.xml')

const VERWACHTE_SLUGS = [
  'oud-beijerland',
  'heinenoord',
  'puttershoek',
  'maasdam',
  'zuid-beijerland',
  'mijnsheerenland',
  's-gravendeel',
  'klaaswaal',
  'strijen',
  'numansdorp',
]

test('werkgebiedPlaatsen.js: exact de 10 verwachte plaatsen, elk met verplichte velden', async () => {
  const mod = await import('../data/werkgebiedPlaatsen.js')
  assert.equal(mod.WERKGEBIED_PLAATSEN.length, 10)

  const slugs = mod.WERKGEBIED_PLAATSEN.map((p) => p.slug)
  for (const verwacht of VERWACHTE_SLUGS) {
    assert.ok(slugs.includes(verwacht), `mist slug ${verwacht}`)
  }

  for (const plaats of mod.WERKGEBIED_PLAATSEN) {
    assert.ok(plaats.naam, `${plaats.slug}: naam ontbreekt`)
    assert.ok(plaats.title, `${plaats.slug}: title ontbreekt`)
    assert.ok(plaats.metaDescription, `${plaats.slug}: metaDescription ontbreekt`)
    assert.ok(plaats.intro, `${plaats.slug}: intro ontbreekt`)
    assert.ok(plaats.feit, `${plaats.slug}: feit ontbreekt`)
    assert.ok(Array.isArray(plaats.faq) && plaats.faq.length > 0, `${plaats.slug}: faq ontbreekt`)
    for (const item of plaats.faq) {
      assert.ok(item.question && item.answer, `${plaats.slug}: FAQ-item mist question/answer`)
    }
    assert.ok(
      typeof plaats.hotspot?.x === 'number' && plaats.hotspot.x >= 0 && plaats.hotspot.x <= 100,
      `${plaats.slug}: hotspot.x moet een percentage zijn`,
    )
    assert.ok(
      typeof plaats.hotspot?.y === 'number' && plaats.hotspot.y >= 0 && plaats.hotspot.y <= 100,
      `${plaats.slug}: hotspot.y moet een percentage zijn`,
    )
  }
})

test('werkgebiedPlaatsen.js: intro-teksten zijn per plaats verschillend (geen sjabloon met alleen de naam verwisseld)', async () => {
  const mod = await import('../data/werkgebiedPlaatsen.js')
  const intros = mod.WERKGEBIED_PLAATSEN.map((p) => p.intro.replace(new RegExp(p.naam, 'g'), '').trim())
  const uniekeIntros = new Set(intros)
  assert.equal(uniekeIntros.size, intros.length, 'twee of meer plaatsen hebben (op de naam na) identieke intro-tekst')
})

test('getWerkgebiedPlaatsBySlug(): vindt een bestaande slug, geeft null voor een onbekende', async () => {
  const mod = await import('../data/werkgebiedPlaatsen.js')
  assert.ok(mod.getWerkgebiedPlaatsBySlug('numansdorp'))
  assert.equal(mod.getWerkgebiedPlaatsBySlug('bestaat-niet'), null)
})

test('routes.js: werkgebiedPlaats(slug) bouwt een top-level pad /:slug', () => {
  assert.match(ROUTES_BRON, /werkgebiedPlaats: \(slug\) => `\/\$\{slug\}`/)
})

test('App.jsx: WerkgebiedPlaats is lazy geladen en geroute op /:plaats', () => {
  assert.match(APP_BRON, /const WerkgebiedPlaats = lazy\(\(\) => import\('\.\/pages\/WerkgebiedPlaats'\)\)/)
  assert.match(APP_BRON, /<Route path="\/:plaats" element={<WerkgebiedPlaats \/>} \/>/)
})

test('WerkgebiedPlaats.jsx: rendert NotFound bij een onbekende slug, en gebruikt breadcrumb-/FAQ-schema', () => {
  assert.match(WERKGEBIED_PLAATS, /if \(!plaats\) \{\s*return <NotFound \/>/)
  assert.match(WERKGEBIED_PLAATS, /getBreadcrumbSchema/)
  assert.match(WERKGEBIED_PLAATS, /getFaqSchema/)
})

test('scripts/prerender.mjs: alle 10 dorpspagina\'s worden meegenomen in de statische build', () => {
  assert.match(PRERENDER, /import \{ WERKGEBIED_PLAATSEN \} from '\.\.\/src\/data\/werkgebiedPlaatsen\.js'/)
  assert.match(PRERENDER, /\.\.\.WERKGEBIED_PLAATSEN\.map\(\(plaats\) => ROUTE_PATHS\.werkgebiedPlaats\(plaats\.slug\)\)/)
})

test('public/sitemap.xml: bevat alle 10 dorps-URL\'s', () => {
  for (const slug of VERWACHTE_SLUGS) {
    assert.match(SITEMAP, new RegExp(`<loc>https://smv-advies\\.nl/${slug}</loc>`))
  }
})

test('Werkgebied.jsx: toont een klikbare hotspot-link per plaats, gebaseerd op WERKGEBIED_PLAATSEN', () => {
  assert.match(WERKGEBIED, /import \{ WERKGEBIED_PLAATSEN \} from '\.\.\/data\/werkgebiedPlaatsen'/)
  assert.match(WERKGEBIED, /WERKGEBIED_PLAATSEN\.map\(\(plaats\) => \(/)
  assert.match(WERKGEBIED, /to={ROUTES\.werkgebiedPlaats\(plaats\.slug\)}/)
  assert.match(WERKGEBIED, /style={\{ left: `\$\{plaats\.hotspot\.x\}%`, top: `\$\{plaats\.hotspot\.y\}%` \}}/)
})
