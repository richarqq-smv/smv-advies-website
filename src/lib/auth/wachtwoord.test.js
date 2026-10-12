import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MIN_WACHTWOORD_LENGTE } from './wachtwoord.js'

test('MIN_WACHTWOORD_LENGTE is 8, gedeeld tussen Registreren.jsx en WachtwoordHerstellen.jsx', () => {
  assert.equal(MIN_WACHTWOORD_LENGTE, 8)
})
