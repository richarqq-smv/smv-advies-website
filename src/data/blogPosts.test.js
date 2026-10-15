import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { BLOG_POSTS, PUBLISHED_BLOG_POSTS, isGepubliceerd } from './blogPosts.js'

/**
 * Regressietest voor de health-check van 2026-10-15: twee artikelen met een
 * toekomstige `isoDate` stonden al in de publieke bloglijst, de sitemap én
 * als "index, follow" geïndexeerde pagina — ondanks dat dit eerder al als
 * aandachtspunt was benoemd. Deze tests vangen zowel het teruggekomen van
 * die specifieke regressie als het algemene geval (elk toekomstig artikel).
 */

test('isGepubliceerd: een artikel met isoDate in het verleden is gepubliceerd', () => {
  assert.equal(isGepubliceerd({ isoDate: '2026-01-01' }, '2026-10-15'), true)
})

test('isGepubliceerd: een artikel met isoDate exact vandaag is al gepubliceerd', () => {
  assert.equal(isGepubliceerd({ isoDate: '2026-10-15' }, '2026-10-15'), true)
})

test('isGepubliceerd: een artikel met isoDate in de toekomst is nog niet gepubliceerd', () => {
  assert.equal(isGepubliceerd({ isoDate: '2026-11-12' }, '2026-10-15'), false)
})

test('PUBLISHED_BLOG_POSTS bevat nooit een artikel met een toekomstige isoDate', () => {
  const vandaag = new Date().toISOString().slice(0, 10)
  for (const post of PUBLISHED_BLOG_POSTS) {
    assert.ok(post.isoDate <= vandaag, `${post.slug} heeft isoDate ${post.isoDate}, dat is na vandaag (${vandaag})`)
  }
})

test('PUBLISHED_BLOG_POSTS bevat elk artikel dat wél al gepubliceerd is (geen onterecht weggelaten posts)', () => {
  const vandaag = new Date().toISOString().slice(0, 10)
  const verwacht = BLOG_POSTS.filter((p) => p.isoDate <= vandaag).map((p) => p.slug)
  const werkelijk = PUBLISHED_BLOG_POSTS.map((p) => p.slug)
  assert.deepEqual(werkelijk.sort(), verwacht.sort())
})

test('sitemap.xml bevat geen URL voor een artikel dat nog niet gepubliceerd is', () => {
  const hier = path.dirname(fileURLToPath(import.meta.url))
  const sitemap = readFileSync(path.join(hier, '..', '..', 'public', 'sitemap.xml'), 'utf8')
  const vandaag = new Date().toISOString().slice(0, 10)
  const nogNietGepubliceerd = BLOG_POSTS.filter((p) => p.isoDate > vandaag)
  for (const post of nogNietGepubliceerd) {
    assert.ok(
      !sitemap.includes(`/blog/${post.slug}<`),
      `sitemap.xml bevat nog een URL voor "${post.slug}" (isoDate ${post.isoDate}, nog niet gepubliceerd)`,
    )
  }
})
