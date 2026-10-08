import { test } from 'node:test'
import assert from 'node:assert/strict'
import { beoordeelVentilatie } from './subsidieVentilatieEligibility.js'
import { SUBSIDIE_STATUSSEN } from './subsidieEligibility.js'

test('ventilatie: lege specificatie -> niet voldoende gegevens', () => {
  const r = beoordeelVentilatie({ specificatie: {} })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.NIET_VOLDOENDE_GEGEVENS)
  assert.equal(r.regel, null)
})

test('ventilatie: uitvoeringsjaar vóór 2026 -> controle vereist (geen regelset vastgelegd; ventilatie is pas vanaf 2026 onderdeel van ISDE, dus bewust geen eerder jaar in isdeVentilatieRegel.js)', () => {
  const r = beoordeelVentilatie({ specificatie: { uitvoeringsjaar: 2025, isolatieBevestigd: 'ja', meldcode: 'X' } })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.CONTROLE_VEREIST)
  assert.equal(r.regel, null)
})

test('ventilatie: expliciet "nee" -> niet van toepassing', () => {
  const r = beoordeelVentilatie({ specificatie: { uitvoeringsjaar: 2026, isolatieBevestigd: 'nee' } })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.NIET_VAN_TOEPASSING)
})

test('ventilatie: jaar bekend maar geïnstalleerd onbekend -> controle vereist, mét bron', () => {
  const r = beoordeelVentilatie({ specificatie: { uitvoeringsjaar: 2026 } })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.CONTROLE_VEREIST)
  assert.match(r.regel.bron.url, /^https:\/\/www\.rvo\.nl\//)
})

test('ventilatie: bevestigd maar meldcode ontbreekt -> waarschijnlijk van toepassing', () => {
  const r = beoordeelVentilatie({ specificatie: { uitvoeringsjaar: 2026, isolatieBevestigd: 'ja' } })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.WAARSCHIJNLIJK_VAN_TOEPASSING)
})

test('ventilatie: volledig ingevuld -> van toepassing, vast bedrag €400, mét waarschuwing over de combinatie-eis in de reden', () => {
  const r = beoordeelVentilatie({ specificatie: { uitvoeringsjaar: 2026, isolatieBevestigd: 'ja', meldcode: 'KA31506' } })
  assert.equal(r.status, SUBSIDIE_STATUSSEN.VAN_TOEPASSING)
  assert.equal(r.regel.bedragVast, 400)
  assert.match(r.redenen[0], /combinatie/)
})

test('ventilatie: elke status heeft minimaal één feitelijke reden', () => {
  const gevallen = [{}, { uitvoeringsjaar: 2025, isolatieBevestigd: 'ja', meldcode: 'X' }, { uitvoeringsjaar: 2026, isolatieBevestigd: 'nee' }, { uitvoeringsjaar: 2026 }, { uitvoeringsjaar: 2026, isolatieBevestigd: 'ja' }]
  gevallen.forEach((specificatie) => {
    const r = beoordeelVentilatie({ specificatie })
    assert.ok(r.redenen.length > 0 && r.redenen[0].trim().length > 0)
  })
})
