import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FISCALE_REGELING_PARAMETERS, FISCALE_REGELING_SOORT, fiscaleRegelingSoortLabel, REGELSET_VERSIE_FISCAAL } from './fiscaleRegelingParameters.js'
import { valideerControleDatum } from './subsidieBronControle.js'

test('regelsetversie is 2026', () => {
  assert.equal(REGELSET_VERSIE_FISCAAL, '2026')
})

test('EIA is een fiscale aftrek, geen directe subsidie', () => {
  assert.equal(FISCALE_REGELING_PARAMETERS.eia.soort, FISCALE_REGELING_SOORT.FISCALE_AFTREK)
  assert.equal(FISCALE_REGELING_PARAMETERS.eia.aftrekPercentage, 40)
  assert.notEqual(FISCALE_REGELING_PARAMETERS.eia.soort, FISCALE_REGELING_SOORT.DIRECTE_SUBSIDIE)
})

test('MIA is een fiscale aftrek met bedrijfsmiddel-afhankelijk percentage (geen hard generiek percentage)', () => {
  assert.equal(FISCALE_REGELING_PARAMETERS.mia.soort, FISCALE_REGELING_SOORT.FISCALE_AFTREK)
  assert.equal(FISCALE_REGELING_PARAMETERS.mia.aftrekPercentage, null)
})

test('Vamil is een fiscale afschrijving, nooit een subsidiepercentage of directe uitbetaling', () => {
  assert.equal(FISCALE_REGELING_PARAMETERS.vamil.soort, FISCALE_REGELING_SOORT.FISCALE_AFSCHRIJVING)
  assert.notEqual(FISCALE_REGELING_PARAMETERS.vamil.soort, FISCALE_REGELING_SOORT.DIRECTE_SUBSIDIE)
  assert.match(FISCALE_REGELING_PARAMETERS.vamil.toelichting, /GEEN subsidiepercentage/)
})

test('geen van de drie regelingen staat geregistreerd als directe_subsidie', () => {
  Object.values(FISCALE_REGELING_PARAMETERS).forEach((r) => {
    assert.notEqual(r.soort, FISCALE_REGELING_SOORT.DIRECTE_SUBSIDIE)
  })
})

test('fiscaleRegelingSoortLabel geeft het juiste label en null voor een onbekende key', () => {
  assert.equal(fiscaleRegelingSoortLabel('eia'), 'Fiscale investeringsaftrek')
  assert.equal(fiscaleRegelingSoortLabel('vamil'), 'Fiscale afschrijvingsmogelijkheid')
  assert.equal(fiscaleRegelingSoortLabel('onbekend'), null)
})

test('elke regeling heeft een minimale investering, meldingstermijn en bron met geldige (niet-toekomstige) controledatum', () => {
  Object.values(FISCALE_REGELING_PARAMETERS).forEach((r) => {
    assert.equal(r.minimaleInvestering, 2500)
    assert.equal(r.meldingstermijnMaanden, 3)
    assert.ok(r.bron?.url?.startsWith('https://www.rvo.nl/'))
    assert.equal(valideerControleDatum(r.bron.gecontroleerdOp).geldig, true)
  })
})
