import { test } from 'node:test'
import assert from 'node:assert/strict'

/**
 * analytics.js roept `window.gtag(...)` rechtstreeks aan — deze stub
 * registreert elke aanroep zodat we het daadwerkelijke gedrag (niet
 * alleen de aanwezigheid van broncode) kunnen controleren: wordt
 * analytics_storage wel/niet geüpdatet, en hoe vaak.
 *
 * `granted` in analytics.js is module-level state (bewust, zie het
 * bestand zelf) — de tests hieronder draaien daarom in een bewuste
 * volgorde die een echte sessie nabootst (eerst geen gtag, dan laden,
 * dan nogmaals laden, dan intrekken, dan opnieuw accepteren) i.p.v. los
 * van elkaar staande cases.
 */
const calls = []
globalThis.window = {
  gtag: (...args) => calls.push(args),
}

/**
 * loadTrustpilot() gebruikt document.createElement/head.appendChild i.p.v.
 * window.gtag — minimale stub die alleen registreert wat er gebeurt,
 * zonder een echte DOM te simuleren.
 */
const appendedScripts = []
globalThis.document = {
  createElement: (tag) => {
    const el = { tag }
    return el
  },
  head: {
    appendChild: (el) => appendedScripts.push(el),
  },
}

const { loadAnalytics, loadTrustpilot, revokeAnalytics, trackEvent } = await import('./analytics.js')

test('loadAnalytics: doet niets als window.gtag geen functie is (gtag.js nog niet geladen)', () => {
  const origineel = globalThis.window.gtag
  globalThis.window.gtag = undefined
  calls.length = 0
  loadAnalytics()
  assert.equal(calls.length, 0)
  globalThis.window.gtag = origineel
})

test('loadAnalytics: stuurt consent update met analytics_storage: granted', () => {
  calls.length = 0
  loadAnalytics()
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], ['consent', 'update', { analytics_storage: 'granted' }])
})

test('loadAnalytics: een tweede aanroep stuurt geen tweede update (geen dubbele initialisatie)', () => {
  calls.length = 0
  loadAnalytics()
  assert.equal(calls.length, 0)
})

test('revokeAnalytics: stuurt consent update met analytics_storage: denied en reset de granted-guard', () => {
  calls.length = 0
  revokeAnalytics()
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], ['consent', 'update', { analytics_storage: 'denied' }])
})

test('loadAnalytics: werkt weer (nieuwe grant) nadat revokeAnalytics de guard heeft gereset', () => {
  calls.length = 0
  loadAnalytics()
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], ['consent', 'update', { analytics_storage: 'granted' }])
})

test('revokeAnalytics: gooit niet als window.gtag geen functie is', () => {
  const origineel = globalThis.window.gtag
  globalThis.window.gtag = undefined
  assert.doesNotThrow(() => revokeAnalytics())
  globalThis.window.gtag = origineel
})

test('loadTrustpilot: voegt het bootstrap-script dynamisch toe aan document.head', () => {
  appendedScripts.length = 0
  loadTrustpilot()
  assert.equal(appendedScripts.length, 1)
  assert.equal(appendedScripts[0].tag, 'script')
})

test('loadTrustpilot: een tweede aanroep voegt het script niet nogmaals toe', () => {
  appendedScripts.length = 0
  loadTrustpilot()
  assert.equal(appendedScripts.length, 0)
})

test('trackEvent: stuurt een GA4-event met naam en params door naar gtag', () => {
  globalThis.window.gtag = (...args) => calls.push(args)
  calls.length = 0
  trackEvent('cta_click', { cta: 'energie_indicatie', location: 'hero' })
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], ['event', 'cta_click', { cta: 'energie_indicatie', location: 'hero' }])
})

test('trackEvent: werkt zonder params-argument', () => {
  calls.length = 0
  trackEvent('energiescan_gestart')
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], ['event', 'energiescan_gestart', {}])
})

test('trackEvent: doet niets als window.gtag geen functie is', () => {
  const origineel = globalThis.window.gtag
  globalThis.window.gtag = undefined
  calls.length = 0
  assert.doesNotThrow(() => trackEvent('contact_form_verzonden'))
  assert.equal(calls.length, 0)
  globalThis.window.gtag = origineel
})
