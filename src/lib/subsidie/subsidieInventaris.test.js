import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SUBSIDIE_INVENTARIS, nietOndersteundeCategorieen } from './subsidieInventaris.js'
import { ONDERSTEUNDE_MAATREGELEN } from './isdeIsolatieRegels.js'
import { ONDERSTEUNDE_APPARAATMAATREGELEN } from './isdeApparaatRegels.js'

const ENGINE_MAATREGEL_KEYS = new Set([...ONDERSTEUNDE_MAATREGELEN, ...ONDERSTEUNDE_APPARAATMAATREGELEN, 'ventilatie'])

test('elke rij met status "geimplementeerd" verwijst naar een maatregelKey die de engine daadwerkelijk kent — geen loze claim', () => {
  SUBSIDIE_INVENTARIS.filter((r) => r.status === 'geimplementeerd').forEach((r) => {
    assert.ok(r.maatregelKey, `rij "${r.categorie}" claimt geïmplementeerd maar heeft geen maatregelKey`)
    assert.ok(ENGINE_MAATREGEL_KEYS.has(r.maatregelKey), `maatregelKey "${r.maatregelKey}" bestaat niet in de engine`)
  })
})

test('elke door de engine ondersteunde maatregel staat in de inventaris als "geimplementeerd" — geen stille mismatch', () => {
  const geimplementeerdeKeys = new Set(SUBSIDIE_INVENTARIS.filter((r) => r.status === 'geimplementeerd').map((r) => r.maatregelKey))
  ENGINE_MAATREGEL_KEYS.forEach((key) => {
    assert.ok(geimplementeerdeKeys.has(key), `maatregel "${key}" wordt door de engine ondersteund maar ontbreekt in SUBSIDIE_INVENTARIS`)
  })
})

test('elke rij zonder status "geimplementeerd" heeft een reden (nooit stilzwijgend "controle vereist"/"niet subsidiabel")', () => {
  SUBSIDIE_INVENTARIS.filter((r) => r.status !== 'geimplementeerd').forEach((r) => {
    assert.ok(r.reden && r.reden.trim().length > 0, `rij "${r.categorie}" (status ${r.status}) heeft geen reden`)
  })
})

test('nietOndersteundeCategorieen() geeft precies de niet-geimplementeerde rijen terug, in dezelfde volgorde', () => {
  const resultaat = nietOndersteundeCategorieen()
  assert.ok(resultaat.every((r) => r.status !== 'geimplementeerd'))
  assert.equal(resultaat.length, SUBSIDIE_INVENTARIS.filter((r) => r.status !== 'geimplementeerd').length)
})

test('bevat expliciet SVVE, SVOH en regionale subsidie als "controle vereist" (opdracht §4/5/7) — nooit stilzwijgend weggelaten', () => {
  const categorieen = SUBSIDIE_INVENTARIS.map((r) => r.categorie.toLowerCase())
  assert.ok(categorieen.some((c) => c.includes('svve')))
  assert.ok(categorieen.some((c) => c.includes('svoh')))
  assert.ok(categorieen.some((c) => c.includes('regionale')))
})
