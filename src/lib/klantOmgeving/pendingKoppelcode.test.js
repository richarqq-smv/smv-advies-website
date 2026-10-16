import { test } from 'node:test'
import assert from 'node:assert/strict'

/**
 * Zelfde localStorage-stub-patroon als consent.test.js — dit project
 * gebruikt geen jsdom/DOM-testrunner.
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
const { bewaarPendingKoppelcode, leesPendingKoppelcode, wisPendingKoppelcode } = await import('./pendingKoppelcode.js')

test('leesPendingKoppelcode: geeft null als er nog niets is opgeslagen', () => {
  assert.equal(leesPendingKoppelcode(), null)
})

test('bewaarPendingKoppelcode + leesPendingKoppelcode: slaat code/naam/email/telefoon op en leest ze terug', () => {
  bewaarPendingKoppelcode({ code: 'abc123', naam: 'Jan Jansen', email: 'jan@voorbeeld.nl', telefoon: '0612345678' })
  assert.deepEqual(leesPendingKoppelcode(), { code: 'abc123', naam: 'Jan Jansen', email: 'jan@voorbeeld.nl', telefoon: '0612345678' })
})

test('bewaarPendingKoppelcode: email/telefoon zijn optioneel (default null)', () => {
  bewaarPendingKoppelcode({ code: 'xyz789', naam: 'Marie de Vries' })
  assert.deepEqual(leesPendingKoppelcode(), { code: 'xyz789', naam: 'Marie de Vries', email: null, telefoon: null })
})

test('wisPendingKoppelcode: verwijdert de opgeslagen gegevens, volgende lees geeft weer null', () => {
  bewaarPendingKoppelcode({ code: 'abc123', naam: 'Jan Jansen' })
  assert.notEqual(leesPendingKoppelcode(), null)
  wisPendingKoppelcode()
  assert.equal(leesPendingKoppelcode(), null)
})

test('leesPendingKoppelcode: geeft null bij kapotte/onvolledige JSON in plaats van te crashen', () => {
  localStorage.setItem('smv-pending-koppelcode', 'dit is geen geldige JSON')
  assert.equal(leesPendingKoppelcode(), null)
  localStorage.setItem('smv-pending-koppelcode', JSON.stringify({ naam: 'Zonder code' }))
  assert.equal(leesPendingKoppelcode(), null)
  localStorage.setItem('smv-pending-koppelcode', JSON.stringify({ code: 'abc', naam: '  ' }))
  assert.equal(leesPendingKoppelcode(), null)
})

test('leesPendingKoppelcode: geeft null i.p.v. te crashen als localStorage ontbreekt/gooit (privébrowsen)', () => {
  const origineel = globalThis.localStorage
  globalThis.localStorage = {
    getItem() {
      throw new Error('localStorage disabled')
    },
  }
  assert.equal(leesPendingKoppelcode(), null)
  globalThis.localStorage = origineel
})

test('bewaarPendingKoppelcode/wisPendingKoppelcode: gooien niet door als localStorage ontbreekt/gooit (privébrowsen)', () => {
  const origineel = globalThis.localStorage
  globalThis.localStorage = {
    setItem() {
      throw new Error('localStorage disabled')
    },
    removeItem() {
      throw new Error('localStorage disabled')
    },
  }
  assert.doesNotThrow(() => bewaarPendingKoppelcode({ code: 'abc', naam: 'Test' }))
  assert.doesNotThrow(() => wisPendingKoppelcode())
  globalThis.localStorage = origineel
})
