import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bouwVandaagOverzicht } from './vandaagOverzicht.js'

const VANDAAG = '2026-09-28'

function dossierFixture(overrides = {}) {
  return {
    dossier_id: 'd1',
    status: 'open',
    mjop_snapshot: null,
    energie_snapshot: null,
    adviespunten: [{ count: 0 }],
    ...overrides,
  }
}

function offerteFixture(overrides = {}) {
  return { id: 'o1', dossier_id: 'd1', status: 'concept', geldig_tot: '2026-10-01', ...overrides }
}

test('offertesOpTeVolgen: alleen verstuurd én niet verlopen', () => {
  const offertes = [
    offerteFixture({ id: 'a', status: 'verstuurd', geldig_tot: '2026-10-01' }), // op te volgen
    offerteFixture({ id: 'b', status: 'verstuurd', geldig_tot: '2026-09-01' }), // verlopen, niet "op te volgen"
    offerteFixture({ id: 'c', status: 'concept', geldig_tot: '2026-10-01' }), // nog concept, niet "op te volgen"
    offerteFixture({ id: 'd', status: 'geaccepteerd', geldig_tot: '2026-10-01' }), // eindstatus, niet "op te volgen"
  ]
  const { offertesOpTeVolgen } = bouwVandaagOverzicht({ offertes }, { vandaag: VANDAAG })
  assert.deepEqual(offertesOpTeVolgen.map((o) => o.id), ['a'])
})

test('offertesVerlopen: concept of verstuurd met geldig_tot in het verleden, nooit een eindstatus', () => {
  const offertes = [
    offerteFixture({ id: 'a', status: 'concept', geldig_tot: '2026-09-01' }),
    offerteFixture({ id: 'b', status: 'verstuurd', geldig_tot: '2026-09-01' }),
    offerteFixture({ id: 'c', status: 'geaccepteerd', geldig_tot: '2026-09-01' }), // eindstatus telt nooit als "verlopen"
    offerteFixture({ id: 'd', status: 'afgewezen', geldig_tot: '2026-09-01' }),
    offerteFixture({ id: 'e', status: 'geannuleerd', geldig_tot: '2026-09-01' }),
  ]
  const { offertesVerlopen } = bouwVandaagOverzicht({ offertes }, { vandaag: VANDAAG })
  assert.deepEqual(offertesVerlopen.map((o) => o.id).sort(), ['a', 'b'])
})

test('offertesOpTeVolgen (Fase 10): gesorteerd op verzonden_op, oudste eerst', () => {
  const offertes = [
    offerteFixture({ id: 'nieuw', status: 'verstuurd', geldig_tot: '2026-10-01', verzonden_op: '2026-09-27T10:00:00Z' }),
    offerteFixture({ id: 'oud', status: 'verstuurd', geldig_tot: '2026-10-01', verzonden_op: '2026-09-10T10:00:00Z' }),
    offerteFixture({ id: 'middel', status: 'verstuurd', geldig_tot: '2026-10-01', verzonden_op: '2026-09-20T10:00:00Z' }),
  ]
  const { offertesOpTeVolgen } = bouwVandaagOverzicht({ offertes }, { vandaag: VANDAAG })
  assert.deepEqual(offertesOpTeVolgen.map((o) => o.id), ['oud', 'middel', 'nieuw'])
})

test('offertesOpTeVolgen: een offerte zonder verzonden_op (zou niet moeten voorkomen) komt achteraan, crasht niet', () => {
  const offertes = [
    offerteFixture({ id: 'zonder-datum', status: 'verstuurd', geldig_tot: '2026-10-01', verzonden_op: null }),
    offerteFixture({ id: 'met-datum', status: 'verstuurd', geldig_tot: '2026-10-01', verzonden_op: '2026-09-10T10:00:00Z' }),
  ]
  const { offertesOpTeVolgen } = bouwVandaagOverzicht({ offertes }, { vandaag: VANDAAG })
  assert.deepEqual(offertesOpTeVolgen.map((o) => o.id), ['met-datum', 'zonder-datum'])
})

test('offerte met geldig_tot exact vandaag is nog niet verlopen', () => {
  const offertes = [offerteFixture({ id: 'a', status: 'verstuurd', geldig_tot: VANDAAG })]
  const { offertesOpTeVolgen, offertesVerlopen } = bouwVandaagOverzicht({ offertes }, { vandaag: VANDAAG })
  assert.deepEqual(offertesOpTeVolgen.map((o) => o.id), ['a'])
  assert.equal(offertesVerlopen.length, 0)
})

test('dossiersZonderMjop/dossiersZonderEnergie: alleen open dossiers tellen mee, afgeronde niet', () => {
  const dossiers = [
    dossierFixture({ dossier_id: 'a', status: 'open', mjop_snapshot: null, energie_snapshot: null }),
    dossierFixture({ dossier_id: 'b', status: 'afgerond', mjop_snapshot: null, energie_snapshot: null }),
    dossierFixture({ dossier_id: 'c', status: 'open', mjop_snapshot: { components: [] }, energie_snapshot: { versie: 1 } }),
  ]
  const { dossiersZonderMjop, dossiersZonderEnergie } = bouwVandaagOverzicht({ dossiers }, { vandaag: VANDAAG })
  assert.deepEqual(dossiersZonderMjop.map((d) => d.dossier_id), ['a'])
  assert.deepEqual(dossiersZonderEnergie.map((d) => d.dossier_id), ['a'])
})

test('dossiersMetOnbehandeldeSignalen: brondata aanwezig, nog 0 adviespunten', () => {
  const dossiers = [
    dossierFixture({ dossier_id: 'a', mjop_snapshot: { components: [{ id: 'c1' }] }, adviespunten: [{ count: 0 }] }),
    dossierFixture({ dossier_id: 'b', mjop_snapshot: { components: [{ id: 'c1' }] }, adviespunten: [{ count: 1 }] }), // al behandeld
    dossierFixture({ dossier_id: 'c', mjop_snapshot: null, energie_snapshot: null, adviespunten: [{ count: 0 }] }), // geen brondata
  ]
  const { dossiersMetOnbehandeldeSignalen } = bouwVandaagOverzicht({ dossiers }, { vandaag: VANDAAG })
  assert.deepEqual(dossiersMetOnbehandeldeSignalen.map((d) => d.dossier_id), ['a'])
})

test('dossiersKlaarVoorAdvies: open dossier met minstens 1 adviespunt', () => {
  const dossiers = [
    dossierFixture({ dossier_id: 'a', adviespunten: [{ count: 2 }] }),
    dossierFixture({ dossier_id: 'b', adviespunten: [{ count: 0 }] }),
    dossierFixture({ dossier_id: 'c', status: 'afgerond', adviespunten: [{ count: 2 }] }), // afgerond, niet meer "in behandeling"
  ]
  const { dossiersKlaarVoorAdvies } = bouwVandaagOverzicht({ dossiers }, { vandaag: VANDAAG })
  assert.deepEqual(dossiersKlaarVoorAdvies.map((d) => d.dossier_id), ['a'])
})

test('dossiersKlaarVoorOfferte: afgerond dossier zonder enige offerte, ook niet met alleen een geannuleerde/afgewezen offerte elders', () => {
  const dossiers = [
    dossierFixture({ dossier_id: 'a', status: 'afgerond' }),
    dossierFixture({ dossier_id: 'b', status: 'afgerond' }),
    dossierFixture({ dossier_id: 'c', status: 'open' }), // nog niet afgerond, telt niet mee
  ]
  const offertes = [offerteFixture({ id: 'o1', dossier_id: 'b', status: 'afgewezen' })]
  const { dossiersKlaarVoorOfferte } = bouwVandaagOverzicht({ dossiers, offertes }, { vandaag: VANDAAG })
  assert.deepEqual(dossiersKlaarVoorOfferte.map((d) => d.dossier_id), ['a'])
})

test('lege input geeft overal lege arrays, nooit een crash', () => {
  const overzicht = bouwVandaagOverzicht({}, { vandaag: VANDAAG })
  for (const lijst of Object.values(overzicht)) {
    assert.deepEqual(lijst, [])
  }
})

test('geeft nooit een score, percentage of voorspelling terug — alleen arrays van feitelijke items', () => {
  const overzicht = bouwVandaagOverzicht({ dossiers: [dossierFixture()], offertes: [offerteFixture()] }, { vandaag: VANDAAG })
  for (const lijst of Object.values(overzicht)) {
    assert.ok(Array.isArray(lijst))
  }
  assert.equal('score' in overzicht, false)
  assert.equal('percentage' in overzicht, false)
})
