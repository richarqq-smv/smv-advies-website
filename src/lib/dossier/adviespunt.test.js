import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createAdviespunt, createSignaalBevroren } from './adviespunt.js'

// Fictieve insight zoals deriveComponentInsight()/buildInsights() in
// lib/mjop/linking.js die zou opleveren — hier letterlijk nagebouwd in
// plaats van geïmporteerd, zelfde reden als elders in deze testmap:
// lib/mjop gebruikt extensieloze imports die onder de kale Node-testrunner
// niet oplossen.
function fictieveInsight(overrides = {}) {
  return {
    componentId: 'component-1',
    componentLabel: 'Cv / verwarming',
    status: 'meenemen_bij_vervanging',
    statusLabel: 'Meenemen bij vervanging',
    statusDescription: 'Relevant zodra dit onderdeel toch wordt vervangen of gerenoveerd.',
    relevantYear: 2027,
    basis: 'vervangingsjaar',
    timeframe: 'vervanging',
    recommendations: [{ measureId: 'warmtepomp', measureName: 'Warmtepomp of andere verwarmingsoplossing', reason: 'fictieve toelichting' }],
    ...overrides,
  }
}

// --- createSignaalBevroren -------------------------------------------------

test('createSignaalBevroren bevat exact de vijf afgesproken velden — L', () => {
  const bevroren = createSignaalBevroren(fictieveInsight())
  assert.deepEqual(Object.keys(bevroren).sort(), ['componentId', 'componentLabel', 'relevantYear', 'status', 'statusLabel'].sort())
  assert.equal(bevroren.componentId, 'component-1')
  assert.equal(bevroren.componentLabel, 'Cv / verwarming')
  assert.equal(bevroren.status, 'meenemen_bij_vervanging')
  assert.equal(bevroren.statusLabel, 'Meenemen bij vervanging')
  assert.equal(bevroren.relevantYear, 2027)
})

test('createSignaalBevroren neemt nooit de recommendations/MEASURES-tekst over', () => {
  const bevroren = createSignaalBevroren(fictieveInsight())
  assert.equal('recommendations' in bevroren, false)
  assert.equal('statusDescription' in bevroren, false)
  assert.equal('basis' in bevroren, false)
  assert.equal('timeframe' in bevroren, false)
})

test('createSignaalBevroren levert een bevroren object op', () => {
  const bevroren = createSignaalBevroren(fictieveInsight())
  assert.equal(Object.isFrozen(bevroren), true)
  assert.throws(() => {
    bevroren.status = 'geen_actie_nodig'
  })
})

test('createSignaalBevroren staat relevantYear: null toe (geen verzonnen jaar)', () => {
  const bevroren = createSignaalBevroren(fictieveInsight({ relevantYear: null }))
  assert.equal(bevroren.relevantYear, null)
})

test('createSignaalBevroren vereist een insight', () => {
  assert.throws(() => createSignaalBevroren(null))
})

// --- createAdviespunt: verplichte velden -----------------------------------

test('createAdviespunt vereist een onderwerp', () => {
  assert.throws(() => createAdviespunt({ herkomst: 'handmatig', adviesStatus: 'later_beoordelen', toelichting: 'iets' }))
  assert.throws(() => createAdviespunt({ onderwerp: '   ', herkomst: 'handmatig', adviesStatus: 'later_beoordelen', toelichting: 'iets' }))
})

test('createAdviespunt vereist een toelichting — ook bij "geen actie nodig"', () => {
  assert.throws(() => createAdviespunt({ onderwerp: 'Dak', herkomst: 'handmatig', adviesStatus: 'geen_actie_nodig' }))
})

test('createAdviespunt vereist een geldige adviesStatus uit de bestaande MJOP-statussen', () => {
  assert.throws(() => createAdviespunt({ onderwerp: 'Dak', herkomst: 'handmatig', adviesStatus: 'niet_bestaand', toelichting: 'iets' }))
})

test('createAdviespunt vereist herkomst automatisch of handmatig', () => {
  assert.throws(() => createAdviespunt({ onderwerp: 'Dak', herkomst: 'adviseur', adviesStatus: 'later_beoordelen', toelichting: 'iets' }))
})

// --- herkomst / signaalBevroren --------------------------------------------

test('handmatig adviespunt werkt zonder automatisch signaal — P', () => {
  const advies = createAdviespunt({ onderwerp: 'Losse notitie', herkomst: 'handmatig', adviesStatus: 'later_beoordelen', toelichting: 'Kort overleg gehad met de klant.' })
  assert.equal(advies.herkomst, 'handmatig')
  assert.equal(advies.signaalBevroren, null)
})

test('createAdviespunt vereist signaalBevroren bij herkomst automatisch', () => {
  assert.throws(() => createAdviespunt({ onderwerp: 'Cv-ketel', herkomst: 'automatisch', adviesStatus: 'nu_onderzoeken', toelichting: 'iets' }))
})

test('createAdviespunt staat geen signaalBevroren toe bij herkomst handmatig', () => {
  const signaalBevroren = createSignaalBevroren(fictieveInsight())
  assert.throws(() =>
    createAdviespunt({ onderwerp: 'Losse notitie', herkomst: 'handmatig', adviesStatus: 'later_beoordelen', toelichting: 'iets', signaalBevroren }),
  )
})

test('automatisch MJOP-signaal wordt bevroren opgenomen in het adviespunt — E', () => {
  const signaalBevroren = createSignaalBevroren(fictieveInsight())
  const advies = createAdviespunt({
    onderwerp: 'Cv / verwarming',
    herkomst: 'automatisch',
    adviesStatus: 'meenemen_bij_vervanging',
    toelichting: 'Bevestigd: meenemen bij de eerstvolgende vervanging.',
    signaalBevroren,
  })
  assert.equal(advies.herkomst, 'automatisch')
  assert.deepEqual(advies.signaalBevroren, signaalBevroren)
  assert.equal(Object.isFrozen(advies.signaalBevroren), true)
})

test('"geen actie nodig" is een volwaardig, expliciet vast te leggen advies — Q', () => {
  const advies = createAdviespunt({ onderwerp: 'Dakisolatie', herkomst: 'handmatig', adviesStatus: 'geen_actie_nodig', toelichting: 'Recent vervangen, geen aanleiding.' })
  assert.equal(advies.adviesStatus, 'geen_actie_nodig')
})

test('"onvoldoende informatie" is een volwaardig, expliciet vast te leggen advies — R', () => {
  const advies = createAdviespunt({ onderwerp: 'Ventilatie', herkomst: 'handmatig', adviesStatus: 'onvoldoende_informatie', toelichting: 'Nader te bepalen tijdens locatiebezoek.' })
  assert.equal(advies.adviesStatus, 'onvoldoende_informatie')
})

// --- Geschrapte velden (readiness review, correctie A) ----------------------

test('vastgesteldDoorAdviseur bestaat nergens als nieuw veld — M', () => {
  const advies = createAdviespunt({ onderwerp: 'Dak', herkomst: 'handmatig', adviesStatus: 'later_beoordelen', toelichting: 'iets' })
  assert.equal('vastgesteldDoorAdviseur' in advies, false)
})

test('brongegevensRef bestaat nergens als nieuw veld — N', () => {
  const signaalBevroren = createSignaalBevroren(fictieveInsight())
  const advies = createAdviespunt({ onderwerp: 'Cv / verwarming', herkomst: 'automatisch', adviesStatus: 'meenemen_bij_vervanging', toelichting: 'iets', signaalBevroren })
  assert.equal('brongegevensRef' in advies, false)
  assert.equal('brongegevensRef' in advies.signaalBevroren, false)
})

test('afhankelijkVan wordt niet geïmplementeerd — O', () => {
  const advies = createAdviespunt({ onderwerp: 'Dak', herkomst: 'handmatig', adviesStatus: 'later_beoordelen', toelichting: 'iets' })
  assert.equal('afhankelijkVan' in advies, false)
})

test('elk adviespunt krijgt een uniek adviespuntId en tijdstempels', () => {
  const a = createAdviespunt({ onderwerp: 'Dak', herkomst: 'handmatig', adviesStatus: 'later_beoordelen', toelichting: 'iets' })
  const b = createAdviespunt({ onderwerp: 'Dak', herkomst: 'handmatig', adviesStatus: 'later_beoordelen', toelichting: 'iets' })
  assert.ok(a.adviespuntId)
  assert.notEqual(a.adviespuntId, b.adviespuntId)
  assert.ok(a.aangemaaktOp)
  assert.equal(a.aangemaaktOp, a.laatstGewijzigd)
})
