import { test } from 'node:test'
import assert from 'node:assert/strict'
import { maatregelenVoorOnderdeel, maatregelSoort, ONDERSTEUNDE_MAATREGELEN_UIT_KOPPELING } from './opnameSubsidieKoppeling.js'
import { ONDERSTEUNDE_MAATREGELEN } from './isdeIsolatieRegels.js'
import { ONDERSTEUNDE_APPARAATMAATREGELEN } from './isdeApparaatRegels.js'

test('dak -> uitsluitend dakisolatie', () => {
  assert.deepEqual(maatregelenVoorOnderdeel('dak'), ['dakisolatie'])
})

test('vloer -> zowel vloerisolatie als bodemisolatie (twee echt verschillende RVO-maatregelen)', () => {
  assert.deepEqual(maatregelenVoorOnderdeel('vloer'), ['vloerisolatie', 'bodemisolatie'])
})

test('glas -> zowel HR++ als triple', () => {
  assert.deepEqual(maatregelenVoorOnderdeel('glas'), ['glasHrpp', 'glasTriple'])
})

test('warmtepomp -> zowel hybride als elektrisch', () => {
  assert.deepEqual(maatregelenVoorOnderdeel('warmtepomp'), ['warmtepomp_hybride', 'warmtepomp_elektrisch'])
})

test('warmtapwater -> uitsluitend zonneboiler', () => {
  assert.deepEqual(maatregelenVoorOnderdeel('warmtapwater'), ['zonneboiler'])
})

test('ventilatie -> uitsluitend ventilatie', () => {
  assert.deepEqual(maatregelenVoorOnderdeel('ventilatie'), ['ventilatie'])
})

test('onderdelen zonder subsidiemaatregel (bv. meterkast, verbruik, isolatie-algemeen) geven een lege lijst, geen gok', () => {
  ;['meterkast', 'verbruik', 'isolatie', 'kierdichting', 'cv', 'verlichting', 'zonnepanelen', 'overig', 'kozijnen', 'deuren'].forEach((code) => {
    assert.deepEqual(maatregelenVoorOnderdeel(code), [])
  })
})

test('onbekende onderdeelcode crasht niet, levert lege lijst', () => {
  assert.deepEqual(maatregelenVoorOnderdeel('iets-wat-niet-bestaat'), [])
})

test('maatregelSoort: isolatiematen geven "isolatie"', () => {
  ;['dakisolatie', 'gevelisolatie', 'vloerisolatie', 'bodemisolatie', 'glasHrpp', 'glasTriple'].forEach((key) => {
    assert.equal(maatregelSoort(key), 'isolatie')
  })
})

test('maatregelSoort: apparaten geven "apparaat"', () => {
  ;['warmtepomp_hybride', 'warmtepomp_elektrisch', 'zonneboiler'].forEach((key) => {
    assert.equal(maatregelSoort(key), 'apparaat')
  })
})

test('maatregelSoort: ventilatie geeft "ventilatie"', () => {
  assert.equal(maatregelSoort('ventilatie'), 'ventilatie')
})

test('maatregelSoort: onbekende key geeft null, geen gok', () => {
  assert.equal(maatregelSoort('iets-wat-niet-bestaat'), null)
})

test('consistentie: elke maatregel die de koppeling noemt, bestaat daadwerkelijk in de engine (isolatie/apparaat/ventilatie)', () => {
  const alleGekoppeldeKeys = new Set(ONDERSTEUNDE_MAATREGELEN_UIT_KOPPELING())
  const engineKeys = new Set([...ONDERSTEUNDE_MAATREGELEN, ...ONDERSTEUNDE_APPARAATMAATREGELEN, 'ventilatie'])
  alleGekoppeldeKeys.forEach((key) => {
    assert.ok(engineKeys.has(key), `maatregel "${key}" in de opname-koppeling bestaat niet in de engine`)
  })
})

test('consistentie: elke door de engine ondersteunde maatregel is bereikbaar via precies één onderdeel in de koppeling', () => {
  const engineKeys = [...ONDERSTEUNDE_MAATREGELEN, ...ONDERSTEUNDE_APPARAATMAATREGELEN, 'ventilatie']
  const alleGekoppeldeKeys = ONDERSTEUNDE_MAATREGELEN_UIT_KOPPELING()
  engineKeys.forEach((key) => {
    assert.ok(alleGekoppeldeKeys.includes(key), `maatregel "${key}" is niet via een opname-onderdeel in te vullen`)
  })
})
