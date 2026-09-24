import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createKlant } from './klant.js'
import { createPand } from './pand.js'
import { createKlantPandRelatie, findKlantPandRelatie, koppelKlantAanPand } from './klantPandRelatie.js'
import { loadAllKlantPandRelaties, loadKlantPandRelatie } from './storage.js'

class MemoryStorage {
  constructor() {
    this.store = new Map()
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null
  }
  setItem(key, value) {
    this.store.set(key, String(value))
  }
  removeItem(key) {
    this.store.delete(key)
  }
}

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage()
})

test('createKlantPandRelatie vereist klantId en pandId', () => {
  assert.throws(() => createKlantPandRelatie({ klantId: 'x' }))
  assert.throws(() => createKlantPandRelatie({ pandId: 'y' }))
  const relatie = createKlantPandRelatie({ klantId: 'klant-1', pandId: 'pand-1' })
  assert.ok(relatie.relatieId)
  assert.equal(relatie.klantId, 'klant-1')
  assert.equal(relatie.pandId, 'pand-1')
})

test('Pand koppelen aan Klant maakt en bewaart een relatie', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = createPand({ omschrijving: 'Testpand' })

  const relatie = koppelKlantAanPand(klant, pand)

  assert.ok(relatie.relatieId)
  assert.equal(relatie.klantId, klant.klantId)
  assert.equal(relatie.pandId, pand.pandId)
  assert.deepEqual(loadKlantPandRelatie(relatie.relatieId), relatie)
})

test('dubbele koppeling wordt voorkomen: dezelfde Klant + Pand levert de bestaande relatie terug', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pand = createPand({ omschrijving: 'Testpand' })

  const eerste = koppelKlantAanPand(klant, pand)
  const tweede = koppelKlantAanPand(klant, pand)

  assert.equal(eerste.relatieId, tweede.relatieId)
  assert.equal(loadAllKlantPandRelaties().length, 1)
})

test('hetzelfde Pand kan later aan een andere Klant worden gekoppeld zonder de oude relatie te verliezen', () => {
  const klantX = createKlant({ naam: 'Klant X' })
  const klantY = createKlant({ naam: 'Klant Y' })
  const pand = createPand({ omschrijving: 'Testpand' })

  const relatieX = koppelKlantAanPand(klantX, pand)
  const relatieY = koppelKlantAanPand(klantY, pand)

  assert.notEqual(relatieX.relatieId, relatieY.relatieId)
  assert.equal(loadAllKlantPandRelaties().length, 2)
  // de oude relatie blijft gewoon vindbaar
  assert.deepEqual(findKlantPandRelatie(klantX.klantId, pand.pandId), relatieX)
  assert.deepEqual(findKlantPandRelatie(klantY.klantId, pand.pandId), relatieY)
})

test('meerdere Panden kunnen aan dezelfde Klant worden gekoppeld', () => {
  const klant = createKlant({ naam: 'Fictief Bedrijf' })
  const pandA = createPand({ omschrijving: 'Pand A' })
  const pandB = createPand({ omschrijving: 'Pand B' })

  koppelKlantAanPand(klant, pandA)
  koppelKlantAanPand(klant, pandB)

  const relatiesVoorKlant = loadAllKlantPandRelaties().filter((r) => r.klantId === klant.klantId)
  assert.equal(relatiesVoorKlant.length, 2)
})

test('findKlantPandRelatie geeft null als er geen koppeling bestaat', () => {
  assert.equal(findKlantPandRelatie('onbestaand-klant', 'onbestaand-pand'), null)
})
