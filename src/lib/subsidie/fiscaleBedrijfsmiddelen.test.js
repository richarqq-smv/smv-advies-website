import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FISCALE_BEDRIJFSMIDDELEN, FISCALE_CATEGORIE, fiscaleBedrijfsmiddelenVoorCategorie, vindFiscaalBedrijfsmiddel } from './fiscaleBedrijfsmiddelen.js'
import { valideerControleDatum } from './subsidieBronControle.js'

const GELDIGE_VERIFICATIESTATUSSEN = ['officieel_geverifieerd', 'mogelijk_relevant', 'controle_vereist']
const GELDIGE_CATEGORIEEN = Object.values(FISCALE_CATEGORIE)
const GELDIGE_REGELINGEN = ['eia', 'mia', 'vamil']

test('elk bedrijfsmiddel heeft een unieke, stabiele interne ID', () => {
  const ids = FISCALE_BEDRIJFSMIDDELEN.map((b) => b.id)
  assert.equal(new Set(ids).size, ids.length)
  ids.forEach((id) => assert.equal(typeof id, 'string'))
})

test('elk bedrijfsmiddel verwijst naar minstens één bekende regeling (eia/mia/vamil)', () => {
  FISCALE_BEDRIJFSMIDDELEN.forEach((b) => {
    assert.ok(Array.isArray(b.regelingen) && b.regelingen.length > 0, `${b.id} heeft geen regelingen`)
    b.regelingen.forEach((r) => assert.ok(GELDIGE_REGELINGEN.includes(r), `${b.id} heeft onbekende regeling "${r}"`))
  })
})

test('elk bedrijfsmiddel heeft een geldig investeringsjaar 2026 (geen vermenging van jaren)', () => {
  FISCALE_BEDRIJFSMIDDELEN.forEach((b) => {
    assert.equal(b.investeringsjaar, 2026, `${b.id} heeft geen investeringsjaar 2026`)
    assert.equal(b.regelsetVersie, '2026', `${b.id} heeft geen regelsetVersie 2026`)
  })
})

test('elk bedrijfsmiddel heeft een bekende, geldige verificatieStatus', () => {
  FISCALE_BEDRIJFSMIDDELEN.forEach((b) => {
    assert.ok(GELDIGE_VERIFICATIESTATUSSEN.includes(b.verificatieStatus), `${b.id} heeft ongeldige verificatieStatus "${b.verificatieStatus}"`)
  })
})

test('elk bedrijfsmiddel heeft een bekende categorie (voor semantische koppeling)', () => {
  FISCALE_BEDRIJFSMIDDELEN.forEach((b) => {
    assert.ok(GELDIGE_CATEGORIEEN.includes(b.categorie), `${b.id} heeft onbekende categorie "${b.categorie}"`)
  })
})

test('elk bedrijfsmiddel heeft een officiële rvo.nl-bron met een niet-toekomstige controledatum', () => {
  FISCALE_BEDRIJFSMIDDELEN.forEach((b) => {
    assert.ok(b.bron?.url?.startsWith('https://www.rvo.nl/'), `${b.id} heeft geen rvo.nl-bron`)
    assert.equal(valideerControleDatum(b.bron.gecontroleerdOp).geldig, true, `${b.id} heeft een ongeldige/toekomstige controledatum`)
    assert.equal(b.officieleUrl.startsWith('https://www.rvo.nl/'), true)
  })
})

test('een "officieel_geverifieerd" bedrijfsmiddel heeft een bevestigde bedrijfsmiddelcode (geen null-code)', () => {
  FISCALE_BEDRIJFSMIDDELEN.filter((b) => b.verificatieStatus === 'officieel_geverifieerd').forEach((b) => {
    assert.notEqual(b.bedrijfsmiddelcode, null, `${b.id} is "officieel_geverifieerd" maar heeft geen code`)
  })
})

test('een "controle_vereist"-bedrijfsmiddel heeft bewust geen bevestigde code en geen percentage (geen fictief cijfer)', () => {
  FISCALE_BEDRIJFSMIDDELEN.filter((b) => b.verificatieStatus === 'controle_vereist').forEach((b) => {
    assert.equal(b.bedrijfsmiddelcode, null, `${b.id} is "controle_vereist" maar heeft toch een code`)
    assert.equal(b.fiscaalParameter.percentage, null, `${b.id} is "controle_vereist" maar heeft toch een percentage`)
  })
})

test('elk bedrijfsmiddel heeft investeringsgrenzen met het wettelijke EIA/MIA/Vamil-minimum (€ 2.500) of een expliciete toelichting waarom niet', () => {
  FISCALE_BEDRIJFSMIDDELEN.forEach((b) => {
    assert.ok(b.investeringsgrenzen, `${b.id} heeft geen investeringsgrenzen-object`)
    assert.equal(b.investeringsgrenzen.minimum, 2500, `${b.id} heeft geen correct minimum`)
  })
})

test('elk bedrijfsmiddel heeft een procedure met meldingstermijn en vereiste dossiergegevens/bewijsstukken', () => {
  FISCALE_BEDRIJFSMIDDELEN.forEach((b) => {
    assert.equal(b.procedure.termijnMaanden, 3, `${b.id} heeft geen 3-maanden-termijn`)
    assert.ok(b.vereisteDossiergegevens.length > 0, `${b.id} heeft geen vereiste dossiergegevens`)
    assert.ok(b.vereisteBewijsstukken.length > 0, `${b.id} heeft geen vereiste bewijsstukken`)
  })
})

test('Groendak (5300) heeft zowel een MIA- als een Vamil-percentage, en nooit samen opgeteld tot één getal', () => {
  const groendak = vindFiscaalBedrijfsmiddel('mia-vamil-5300')
  assert.ok(groendak)
  assert.equal(groendak.fiscaalParameter.percentage, 45)
  assert.equal(groendak.fiscaalParameterVamil.percentage, 75)
  // Twee aparte velden, geen gecombineerd veld "totaalPercentage" of vergelijkbaar.
  assert.equal('totaalPercentage' in groendak, false)
})

test('fiscaleBedrijfsmiddelenVoorCategorie filtert correct en geeft een lege array voor een onbekende categorie', () => {
  const isolatie = fiscaleBedrijfsmiddelenVoorCategorie(FISCALE_CATEGORIE.ISOLATIE)
  assert.ok(isolatie.length > 0)
  isolatie.forEach((b) => assert.equal(b.categorie, FISCALE_CATEGORIE.ISOLATIE))
  assert.deepEqual(fiscaleBedrijfsmiddelenVoorCategorie('onbekende-categorie'), [])
})

test('vindFiscaalBedrijfsmiddel geeft null voor een onbekend ID, geen crash', () => {
  assert.equal(vindFiscaalBedrijfsmiddel('bestaat-niet'), null)
})

test('geen enkel bedrijfsmiddel presenteert Vamil als "directe_subsidie"', () => {
  FISCALE_BEDRIJFSMIDDELEN.filter((b) => b.fiscaalParameterVamil).forEach((b) => {
    assert.notEqual(b.fiscaalParameterVamil.type, 'directe_subsidie')
  })
})
