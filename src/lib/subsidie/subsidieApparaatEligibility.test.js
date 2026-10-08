import { test } from 'node:test'
import assert from 'node:assert/strict'
import { beoordeelApparaatMaatregel } from './subsidieApparaatEligibility.js'
import { SUBSIDIE_STATUSSEN } from './subsidieEligibility.js'

test('apparaat: lege specificatie -> niet voldoende gegevens (jaar ontbreekt), geen bron', () => {
  const r = beoordeelApparaatMaatregel({ apparaatKey: 'warmtepomp_hybride', specificatie: {} })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.NIET_VOLDOENDE_GEGEVENS)
  assert.equal(r.regel, null)
})

test('apparaat: jaar bekend maar geïnstalleerd nog onbekend -> controle vereist, mét de algemene infopagina als bron', () => {
  const r = beoordeelApparaatMaatregel({ apparaatKey: 'warmtepomp_hybride', specificatie: { uitvoeringsjaar: 2026 } })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.CONTROLE_VEREIST)
  assert.match(r.regel.bron.url, /^https:\/\/www\.rvo\.nl\//)
})

test('apparaat: expliciet bevestigd dat het NIET wordt geïnstalleerd -> niet van toepassing', () => {
  const r = beoordeelApparaatMaatregel({ apparaatKey: 'zonneboiler', specificatie: { uitvoeringsjaar: 2026, isolatieBevestigd: 'nee' } })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.NIET_VAN_TOEPASSING)
})

test('apparaat: geïnstalleerd bevestigd maar meldcode/bedrag/bron nog niet ingevuld -> waarschijnlijk van toepassing, nooit een gegokt bedrag', () => {
  const r = beoordeelApparaatMaatregel({ apparaatKey: 'warmtepomp_elektrisch', specificatie: { uitvoeringsjaar: 2026, isolatieBevestigd: 'ja' } })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.WAARSCHIJNLIJK_VAN_TOEPASSING)
  assert.ok(r.ontbrekendeGegevens.some((g) => g.includes('Meldcode')))
  assert.ok(r.ontbrekendeGegevens.some((g) => g.includes('bedrag')))
  assert.ok(r.ontbrekendeGegevens.some((g) => g.includes('URL')))
})

test('apparaat: meldcode + bedrag + bronUrl volledig ingevuld (overgenomen van de officiële meldcodepagina) -> van toepassing', () => {
  const r = beoordeelApparaatMaatregel({
    apparaatKey: 'warmtepomp_hybride',
    specificatie: { uitvoeringsjaar: 2026, isolatieBevestigd: 'ja', meldcode: 'KA20994', bedrag: 1925, bronUrl: 'https://www.rvo.nl/meldcodes-warmtepompen/ka20994-itho-daalderop-vincent-v45-hybride' },
  })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.VAN_TOEPASSING)
  assert.equal(r.regel.productBronUrl, 'https://www.rvo.nl/meldcodes-warmtepompen/ka20994-itho-daalderop-vincent-v45-hybride')
  assert.deepEqual(r.ontbrekendeGegevens, [])
})

test('apparaat: elke status heeft minimaal één feitelijke reden, nooit een lege uitleg', () => {
  const gevallen = [
    {},
    { uitvoeringsjaar: 2026 },
    { uitvoeringsjaar: 2026, isolatieBevestigd: 'nee' },
    { uitvoeringsjaar: 2026, isolatieBevestigd: 'ja' },
    { uitvoeringsjaar: 2026, isolatieBevestigd: 'ja', meldcode: 'X', bedrag: 100, bronUrl: 'https://www.rvo.nl/x' },
  ]
  gevallen.forEach((specificatie) => {
    const r = beoordeelApparaatMaatregel({ apparaatKey: 'zonneboiler', specificatie })
    assert.ok(r.redenen.length > 0 && r.redenen[0].trim().length > 0)
  })
})

test('onbekend apparaat-key levert geen crash en geen bron op in de controle-vereist-stap', () => {
  const r = beoordeelApparaatMaatregel({ apparaatKey: 'onbekend_apparaat', specificatie: { uitvoeringsjaar: 2026 } })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.CONTROLE_VEREIST)
  assert.equal(r.regel, null)
})
