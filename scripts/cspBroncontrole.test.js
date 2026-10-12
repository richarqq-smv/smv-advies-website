import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * Broncontrole voor implementatieronde 2026-10-12, punt 6: Content-
 * Security-Policy. De CSP-meta-tag wordt bewust NIET in de brontemplate
 * (index.html) gezet — die wordt ook door `vite dev` geserveerd, en
 * Vite's eigen React-Refresh/HMR-inline-scripts zouden een strikte CSP
 * laten vastlopen — maar pas door scripts/prerender.mjs in elk
 * gegenereerd dist/*.html-bestand geïnjecteerd, na de build.
 */
const indexHtml = readFileSync('index.html', 'utf8')
const prerenderMjs = readFileSync('scripts/prerender.mjs', 'utf8')

test('index.html bevat GEEN CSP-meta-tag (die zou ook vite dev/HMR raken)', () => {
  assert.doesNotMatch(indexHtml, /http-equiv="Content-Security-Policy"/)
})

test('index.html: de vroeger inline Consent-Mode/gtag-scripts zijn externe, same-origin bestanden', () => {
  assert.match(indexHtml, /<script src="\/consent-mode\.js"><\/script>/)
  assert.match(indexHtml, /<script src="\/gtag-init\.js"><\/script>/)
  assert.doesNotMatch(indexHtml, /window\.dataLayer = window\.dataLayer \|\| \[\]/)
})

test('prerender.mjs: injecteert de CSP-meta-tag pas na de prerender-loop, in elk dist/*.html-bestand', () => {
  assert.match(prerenderMjs, /async function injecteerContentSecurityPolicy\(\)/)
  assert.match(prerenderMjs, /await injecteerContentSecurityPolicy\(\)/)
  const callIndex = prerenderMjs.indexOf('await injecteerContentSecurityPolicy()')
  const rmIndex = prerenderMjs.indexOf('await rm(ssrDir')
  assert.ok(callIndex > 0 && rmIndex > callIndex)
})

test('prerender.mjs: script-src staat op zichzelf + Google-tag-domein + exacte sha256-hashes, geen \'unsafe-inline\' voor scripts', () => {
  const functieStart = prerenderMjs.indexOf('async function injecteerContentSecurityPolicy')
  const functieDeel = prerenderMjs.slice(functieStart, functieStart + 2200)
  assert.match(functieDeel, /script-src \$\{scriptSrcBronnen\}/)
  assert.match(functieDeel, /'sha256-\$\{h\}'/)
  assert.doesNotMatch(functieDeel, /script-src[^`]*'unsafe-inline'/)
  assert.match(functieDeel, /object-src 'none'/)
})

test('prerender.mjs: alleen inline <script>-elementen (geen src-attribuut) worden gehasht', () => {
  const functieStart = prerenderMjs.indexOf('function verzamelInlineScriptHashes')
  const functieDeel = prerenderMjs.slice(functieStart, functieStart + 500)
  assert.match(functieDeel, /\\bsrc\\s\*=/)
})
