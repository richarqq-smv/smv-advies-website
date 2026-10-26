import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Regressie (weekcheck 2026-10-26): routes achter RequireAuth renderen bij
 * het prerenderen geen <Seo>. Zonder reset erfden ze de titel en robots van
 * de vorige route; /MJOP-Tool stond zo als "Algemene voorwaarden" met
 * "index, follow" in de build.
 */
const HIER = path.dirname(fileURLToPath(import.meta.url))
const ENTRY = readFileSync(path.join(HIER, '..', 'src', 'entry-server.jsx'), 'utf8')
const PRERENDER = readFileSync(path.join(HIER, 'prerender.mjs'), 'utf8')

test('entry-server.jsx: zet de SEO-registry per route terug vóór het renderen', () => {
  assert.match(ENTRY, /export function render\(url\) \{[\s\S]*?setLastSeo\(null\)[\s\S]*?renderToPipeableStream/)
})

test('prerender.mjs: een route zonder <Seo> krijgt noindex, nofollow', () => {
  assert.match(PRERENDER, /const robots = !seo \|\| seo\.noindex \? 'noindex, nofollow' : 'index, follow'/)
})
