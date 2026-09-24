import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createAdviespunt } from './adviespunt.js'
import { groepeerAdviespunten, ADVIESRESULTAAT_VOLGORDE } from './adviesresultaat.js'

function punt(overrides = {}) {
  return createAdviespunt({
    onderwerp: 'Test',
    herkomst: 'handmatig',
    adviesStatus: 'later_beoordelen',
    toelichting: 'Testtoelichting.',
    ...overrides,
  })
}

test('alle vijf statussen worden correct gegroepeerd', () => {
  const adviespunten = [
    punt({ onderwerp: 'A', adviesStatus: 'nu_onderzoeken' }),
    punt({ onderwerp: 'B', adviesStatus: 'onvoldoende_informatie' }),
    punt({ onderwerp: 'C', adviesStatus: 'meenemen_bij_vervanging' }),
    punt({ onderwerp: 'D', adviesStatus: 'later_beoordelen' }),
    punt({ onderwerp: 'E', adviesStatus: 'geen_actie_nodig' }),
  ]

  const { groepen, totaal } = groepeerAdviespunten(adviespunten)

  assert.equal(totaal, 5)
  for (const groep of groepen) {
    assert.equal(groep.aantal, 1)
    assert.equal(groep.adviespunten.length, 1)
    assert.equal(groep.adviespunten[0].adviesStatus, groep.status)
  }
})

test('lege groepen krijgen aantal 0 en een lege lijst, geen crash', () => {
  const adviespunten = [punt({ adviesStatus: 'nu_onderzoeken' })]
  const { groepen } = groepeerAdviespunten(adviespunten)

  const leeg = groepen.filter((g) => g.status !== 'nu_onderzoeken')
  assert.equal(leeg.length, 4)
  for (const groep of leeg) {
    assert.equal(groep.aantal, 0)
    assert.deepEqual(groep.adviespunten, [])
  }
})

test('ontbrekende of lege adviespunten-lijst levert vijf lege groepen op, geen crash', () => {
  assert.doesNotThrow(() => groepeerAdviespunten())
  const { groepen, totaal } = groepeerAdviespunten([])
  assert.equal(totaal, 0)
  assert.equal(groepen.length, 5)
  assert.ok(groepen.every((g) => g.aantal === 0))
})

test('de volgorde van de groepen is exact ADVIESRESULTAAT_VOLGORDE, niet de STATUSES-key-volgorde', () => {
  const { groepen } = groepeerAdviespunten([])
  assert.deepEqual(
    groepen.map((g) => g.status),
    ADVIESRESULTAAT_VOLGORDE,
  )
  // expliciet: onvoldoende_informatie staat vóór meenemen_bij_vervanging/later_beoordelen
  assert.deepEqual(ADVIESRESULTAAT_VOLGORDE, [
    'nu_onderzoeken',
    'onvoldoende_informatie',
    'meenemen_bij_vervanging',
    'later_beoordelen',
    'geen_actie_nodig',
  ])
})

test('adviespunten met verschillende herkomst worden correct in dezelfde statusgroep geplaatst', () => {
  const signaalBevroren = Object.freeze({ componentId: 'dak', componentLabel: 'Dak', status: 'meenemen_bij_vervanging', statusLabel: 'Meenemen bij vervanging', relevantYear: 2029 })
  const automatisch = punt({ onderwerp: 'Automatisch', herkomst: 'automatisch', adviesStatus: 'meenemen_bij_vervanging', signaalBevroren })
  const handmatig = punt({ onderwerp: 'Handmatig', herkomst: 'handmatig', adviesStatus: 'meenemen_bij_vervanging' })

  const { groepen } = groepeerAdviespunten([automatisch, handmatig])
  const groep = groepen.find((g) => g.status === 'meenemen_bij_vervanging')

  assert.equal(groep.aantal, 2)
  assert.deepEqual(
    groep.adviespunten.map((a) => a.herkomst).sort(),
    ['automatisch', 'handmatig'],
  )
})

test('het oorspronkelijke signaal blijft beschikbaar op een gegroepeerd adviespunt', () => {
  const signaalBevroren = Object.freeze({ componentId: 'beglazing', componentLabel: 'Ramen / beglazing', status: 'meenemen_bij_vervanging', statusLabel: 'Meenemen bij vervanging', relevantYear: 2028 })
  const advies = punt({ herkomst: 'automatisch', adviesStatus: 'later_beoordelen', signaalBevroren })

  const { groepen } = groepeerAdviespunten([advies])
  const groep = groepen.find((g) => g.status === 'later_beoordelen')

  assert.deepEqual(groep.adviespunten[0].signaalBevroren, signaalBevroren)
  // de afwijking blijft zichtbaar: advies wijkt af van het bevroren signaal
  assert.notEqual(groep.adviespunten[0].adviesStatus, groep.adviespunten[0].signaalBevroren.status)
})

test('groepeerAdviespunten muteert de oorspronkelijke adviespunten-array of -objecten niet', () => {
  const adviespunten = Object.freeze([punt({ adviesStatus: 'nu_onderzoeken' }), punt({ adviesStatus: 'geen_actie_nodig' })])

  assert.doesNotThrow(() => groepeerAdviespunten(adviespunten))
  const { groepen } = groepeerAdviespunten(adviespunten)

  // de groepsarrays zijn nieuwe arrays, niet de bevroren invoerarray zelf
  const gevuldeGroep = groepen.find((g) => g.status === 'nu_onderzoeken')
  assert.notEqual(gevuldeGroep.adviespunten, adviespunten)
  assert.equal(Object.isFrozen(adviespunten), true)
  assert.equal(adviespunten.length, 2)
})
