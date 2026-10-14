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

const { loadAnalytics, revokeAnalytics } = await import('./analytics.js')

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
