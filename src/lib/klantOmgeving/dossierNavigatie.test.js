import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bepaalDossierOverzichtRoute, voegDossierContextToe, leesDossierContext, kiesVoorkeursDossier } from './dossierNavigatie.js'
import { ROUTES } from '../routes.js'

test('admin gaat terug naar het admin-dossieroverzicht', () => {
  assert.equal(bepaalDossierOverzichtRoute(true), ROUTES.admin)
})

test('klant gaat terug naar het eigen accountoverzicht', () => {
  assert.equal(bepaalDossierOverzichtRoute(false), ROUTES.account)
})

test('voegDossierContextToe: voegt ?dossierId= toe aan een pad zonder querystring', () => {
  assert.equal(voegDossierContextToe(ROUTES.energieIndicatie, 'd-1'), '/energie-indicatie?dossierId=d-1')
})

test('voegDossierContextToe: gebruikt & als het pad al een querystring heeft', () => {
  assert.equal(voegDossierContextToe('/energie-indicatie?foo=bar', 'd-1'), '/energie-indicatie?foo=bar&dossierId=d-1')
})

test('voegDossierContextToe: zonder dossierId blijft het pad ongewijzigd', () => {
  assert.equal(voegDossierContextToe(ROUTES.energieIndicatie, null), ROUTES.energieIndicatie)
  assert.equal(voegDossierContextToe(ROUTES.energieIndicatie, undefined), ROUTES.energieIndicatie)
  assert.equal(voegDossierContextToe(ROUTES.energieIndicatie, ''), ROUTES.energieIndicatie)
})

test('voegDossierContextToe: codeert het dossierId veilig voor gebruik in een URL', () => {
  assert.equal(voegDossierContextToe(ROUTES.energieIndicatie, 'a b&c'), '/energie-indicatie?dossierId=a%20b%26c')
})

test('leesDossierContext: leest dossierId uit URLSearchParams', () => {
  assert.equal(leesDossierContext(new URLSearchParams('dossierId=d-1&foo=bar')), 'd-1')
})

test('leesDossierContext: geeft null zonder dossierId of zonder searchParams', () => {
  assert.equal(leesDossierContext(new URLSearchParams('foo=bar')), null)
  assert.equal(leesDossierContext(undefined), null)
})

// --- kiesVoorkeursDossier (security: alleen kiezen uit een al tenant-gescoopte lijst) ---

const OPEN_DOSSIERS = [{ dossier_id: 'd-eigen-1' }, { dossier_id: 'd-eigen-2' }]

test('kiesVoorkeursDossier: kiest de voorkeur als die in de eigen open dossiers voorkomt', () => {
  assert.equal(kiesVoorkeursDossier(OPEN_DOSSIERS, 'd-eigen-2'), 'd-eigen-2')
})

test('kiesVoorkeursDossier (security): een vreemd/niet-eigen dossierId wordt genegeerd, nooit direct gekozen', () => {
  assert.equal(kiesVoorkeursDossier(OPEN_DOSSIERS, 'd-van-een-ander'), 'd-eigen-1')
})

test('kiesVoorkeursDossier: zonder voorkeur valt terug op het eerste open dossier', () => {
  assert.equal(kiesVoorkeursDossier(OPEN_DOSSIERS, null), 'd-eigen-1')
  assert.equal(kiesVoorkeursDossier(OPEN_DOSSIERS, undefined), 'd-eigen-1')
})

test('kiesVoorkeursDossier: zonder open dossiers en zonder geldige voorkeur valt terug op "nieuw"', () => {
  assert.equal(kiesVoorkeursDossier([], 'd-van-een-ander'), 'nieuw')
  assert.equal(kiesVoorkeursDossier([], null), 'nieuw')
})
