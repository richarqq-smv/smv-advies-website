import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bepaalDossierRechten } from './rechten.js'

test('klant mag in een open dossier geen advies bewerken, niet afronden en geen offertes beheren', () => {
  assert.deepEqual(bepaalDossierRechten({ isAdmin: false, status: 'open' }), {
    magAdviesBewerken: false,
    magAfronden: false,
    magOffertesBeheren: false,
    toontAdviespunten: false,
  })
})

test('klant ziet de adviespunten pas als het dossier is afgerond, maar mag nog steeds niets bewerken', () => {
  assert.deepEqual(bepaalDossierRechten({ isAdmin: false, status: 'afgerond' }), {
    magAdviesBewerken: false,
    magAfronden: false,
    magOffertesBeheren: false,
    toontAdviespunten: true,
  })
})

test('admin mag in een open dossier advies bewerken, afronden en offertes beheren', () => {
  assert.deepEqual(bepaalDossierRechten({ isAdmin: true, status: 'open' }), {
    magAdviesBewerken: true,
    magAfronden: true,
    magOffertesBeheren: true,
    toontAdviespunten: true,
  })
})

test('ook de admin kan een afgerond dossier niet meer bewerken of opnieuw afronden', () => {
  const rechten = bepaalDossierRechten({ isAdmin: true, status: 'afgerond' })
  assert.equal(rechten.magAdviesBewerken, false)
  assert.equal(rechten.magAfronden, false)
  assert.equal(rechten.magOffertesBeheren, true)
})

test('onbekende admin-status (nog aan het laden) geeft nooit bewerkrechten', () => {
  for (const isAdmin of [undefined, null, 'bezig']) {
    const rechten = bepaalDossierRechten({ isAdmin, status: 'open' })
    assert.equal(rechten.magAdviesBewerken, false)
    assert.equal(rechten.magOffertesBeheren, false)
  }
})
