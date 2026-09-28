import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bouwDossierExportJson } from './dossierExport.js'

function dossierFixture(overrides = {}) {
  return {
    dossier_id: 'd1',
    status: 'open',
    klanten: { naam: 'Jan Jansen', bedrijfsnaam: 'Jansen BV' },
    contactpersonen: { naam: 'Jan Jansen', email: 'jan@jansenbv.test' },
    panden: { omschrijving: 'Hoofdkantoor', adres: 'Teststraat 1' },
    pand_snapshot: { bouwjaar: 1998 },
    mjop_snapshot: { components: [] },
    energie_snapshot: null,
    created_at: '2026-09-01T00:00:00.000Z',
    ...overrides,
  }
}

test('bouwDossierExportJson: geldige, parsebare JSON met exportversie en tijdstempel', () => {
  const json = bouwDossierExportJson({ dossier: dossierFixture() })
  const parsed = JSON.parse(json)
  assert.equal(parsed.exportVersie, 1)
  assert.ok(typeof parsed.geexporteerdOp === 'string')
  assert.equal(parsed.dossier.dossierId, 'd1')
  assert.equal(parsed.dossier.klant.naam, 'Jan Jansen')
})

test('bouwDossierExportJson: adviespunten worden vertaald naar camelCase velden, snake_case lekt niet door', () => {
  const adviespunten = [
    {
      adviespunt_id: 'a1',
      onderwerp: 'Dak',
      herkomst: 'handmatig',
      advies_status: 'nu_onderzoeken',
      toelichting: 'Isolatie bekijken',
      herbeoordelen_bij: 'Over twee jaar',
      herbeoordelen_datum: '2028-01-01',
      signaal_bevroren: null,
    },
  ]
  const json = bouwDossierExportJson({ dossier: dossierFixture(), adviespunten })
  const parsed = JSON.parse(json)
  assert.equal(parsed.adviespunten[0].adviesStatus, 'nu_onderzoeken')
  assert.equal(parsed.adviespunten[0].herbeoordelenDatum, '2028-01-01')
  assert.equal('advies_status' in parsed.adviespunten[0], false)
})

test('bouwDossierExportJson: offertes worden meegenomen met status/bedragen, geen interne id/aangemaakt_door', () => {
  const offertes = [
    { id: 'o1', offerte_nummer: 'SMV-OFF-2026-0001', status: 'verstuurd', offerte_datum: '2026-09-01', geldig_tot: '2026-10-01', verzonden_op: '2026-09-02T10:00:00Z', pakket_id: 'basis', bedrag: 495, totaal: 598.95, aangemaakt_door: 'uuid-123' },
  ]
  const json = bouwDossierExportJson({ dossier: dossierFixture(), offertes })
  const parsed = JSON.parse(json)
  assert.equal(parsed.offertes[0].offerteNummer, 'SMV-OFF-2026-0001')
  assert.equal(parsed.offertes[0].totaal, 598.95)
  assert.equal('aangemaakt_door' in parsed.offertes[0], false)
  assert.equal('id' in parsed.offertes[0], false)
})

test('bouwDossierExportJson: lege adviespunten/offertes geven lege arrays, nooit een crash', () => {
  const json = bouwDossierExportJson({ dossier: dossierFixture() })
  const parsed = JSON.parse(json)
  assert.deepEqual(parsed.adviespunten, [])
  assert.deepEqual(parsed.offertes, [])
})
