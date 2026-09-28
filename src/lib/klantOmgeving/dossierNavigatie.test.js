import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bepaalDossierOverzichtRoute } from './dossierNavigatie.js'
import { ROUTES } from '../routes.js'

test('admin gaat terug naar het admin-dossieroverzicht', () => {
  assert.equal(bepaalDossierOverzichtRoute(true), ROUTES.admin)
})

test('klant gaat terug naar het eigen accountoverzicht', () => {
  assert.equal(bepaalDossierOverzichtRoute(false), ROUTES.account)
})
