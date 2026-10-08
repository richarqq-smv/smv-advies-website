import { test } from 'node:test'
import assert from 'node:assert/strict'
import { naarCamelCaseSpecificatie, naarSpecificatiesPerMaatregel } from './subsidieSpecificatieMapping.js'

test('naarCamelCaseSpecificatie: null blijft null, crasht niet', () => {
  assert.equal(naarCamelCaseSpecificatie(null), null)
})

test('naarCamelCaseSpecificatie: vertaalt alle snake_case velden naar camelCase', () => {
  const rij = {
    uitvoeringsjaar: 2026,
    oppervlakte_m2: 120,
    technische_waarde: 3.5,
    meldcode: 'KA30327',
    isolatie_bevestigd: 'ja',
    notitie: 'test',
    bedrag: 1925,
    bron_url: 'https://www.rvo.nl/x',
    doelgroep: 'eigenaar_bewoner',
  }
  const camel = naarCamelCaseSpecificatie(rij)
  assert.equal(camel.oppervlakteM2, 120)
  assert.equal(camel.technischeWaarde, 3.5)
  assert.equal(camel.isolatieBevestigd, 'ja')
  assert.equal(camel.bronUrl, 'https://www.rvo.nl/x')
})

test('naarSpecificatiesPerMaatregel: bouwt een map op maatregel_key, lege input geeft lege map', () => {
  assert.deepEqual(naarSpecificatiesPerMaatregel([]), {})
  assert.deepEqual(naarSpecificatiesPerMaatregel(undefined), {})
  const map = naarSpecificatiesPerMaatregel([
    { maatregel_key: 'dakisolatie', uitvoeringsjaar: 2026, oppervlakte_m2: 100, technische_waarde: 3.5, meldcode: 'X', isolatie_bevestigd: 'ja' },
    { maatregel_key: 'ventilatie', uitvoeringsjaar: 2026, meldcode: 'Y', isolatie_bevestigd: 'onbekend' },
  ])
  assert.equal(map.dakisolatie.oppervlakteM2, 100)
  assert.equal(map.ventilatie.meldcode, 'Y')
  assert.equal(map.gevelisolatie, undefined)
})
