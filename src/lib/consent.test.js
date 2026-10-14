import { test } from 'node:test'
import assert from 'node:assert/strict'

/**
 * consent.js leest/schrijft de globale `localStorage` rechtstreeks (geen
 * `window.localStorage`) — deze minimale in-memory stub maakt dat
 * daadwerkelijk testbaar zonder jsdom (dit project gebruikt geen DOM-
 * testrunner, zie andere *Broncontrole.test.js-bestanden).
 */
function stubLocalStorage() {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  }
}

stubLocalStorage()
const { getStoredConsent, storeConsent, clearConsent } = await import('./consent.js')

test('getStoredConsent: geeft null als er nog geen keuze is opgeslagen', () => {
  assert.equal(getStoredConsent(), null)
})

test('storeConsent + getStoredConsent: slaat "accepted" op en leest het terug', () => {
  storeConsent('accepted')
  assert.equal(getStoredConsent(), 'accepted')
})

test('storeConsent + getStoredConsent: slaat "declined" op en leest het terug', () => {
  storeConsent('declined')
  assert.equal(getStoredConsent(), 'declined')
})

test('clearConsent: verwijdert een eerder opgeslagen keuze, volgende check geeft weer null', () => {
  storeConsent('accepted')
  assert.equal(getStoredConsent(), 'accepted')
  clearConsent()
  assert.equal(getStoredConsent(), null)
})

test('getStoredConsent: geeft null i.p.v. te crashen als localStorage ontbreekt/gooit (privébrowsen)', () => {
  const origineel = globalThis.localStorage
  globalThis.localStorage = {
    getItem() {
      throw new Error('localStorage disabled')
    },
  }
  assert.equal(getStoredConsent(), null)
  globalThis.localStorage = origineel
})

test('storeConsent/clearConsent: gooien niet door als localStorage ontbreekt/gooit (privébrowsen)', () => {
  const origineel = globalThis.localStorage
  globalThis.localStorage = {
    setItem() {
      throw new Error('localStorage disabled')
    },
    removeItem() {
      throw new Error('localStorage disabled')
    },
  }
  assert.doesNotThrow(() => storeConsent('accepted'))
  assert.doesNotThrow(() => clearConsent())
  globalThis.localStorage = origineel
})
