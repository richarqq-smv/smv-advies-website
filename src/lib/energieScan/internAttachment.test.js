import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildInterneJsonPayload, buildInterneJsonBestandsnaam, ENERGIE_INDICATIE_JSON_FORMAT_VERSION } from './internAttachment.js'

function valuesFixture(overrides = {}) {
  return {
    pandtype: 'kantoor',
    bouwjaar: 'voor_1980',
    oppervlakte: '500',
    verdiepingen: '2',
    beglazing: 'onbekend',
    isolatie_gevel: 'onbekend',
    isolatie_dak: 'onbekend',
    isolatie_vloer: 'onbekend',
    verwarming: 'hr_ketel',
    gasverbruik: '',
    elekverbruik: '',
    energiekosten: '',
    naam: 'Jan Jansen',
    bedrijfsnaam: 'Jansen & Zn. B.V.',
    email: 'jan@bedrijf.test',
    telefoon: '0612345678',
    ...overrides,
  }
}

function resultFixture(overrides = {}) {
  return {
    score: 34,
    band: { band: 2, status: 'Nog veel potentieel', desc: 'Er is nog veel te winnen.' },
    huidig: { gas: 2000, elek: 15000, bron: 'schatting' },
    maatregelen: [{ naam: 'Dakisolatie', besparingEuro: 2600, besparingM3: 2000, investeringLaag: 8750, investeringHoog: 13750, terugverdientijd: 4.3, toelichting: 'Isoleer het dak.' }],
    huidigeKosten: 27615,
    totaleBesparing: 16621,
    co2: 20272,
    ...overrides,
  }
}

test('buildInterneJsonPayload: bevat een formatVersion en een ISO-tijdstip', () => {
  const payload = buildInterneJsonPayload(valuesFixture(), resultFixture())
  assert.equal(payload.formatVersion, ENERGIE_INDICATIE_JSON_FORMAT_VERSION)
  assert.match(payload.gegenereerdOp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
})

test('buildInterneJsonPayload: bevat de relevante contactgegevens', () => {
  const payload = buildInterneJsonPayload(valuesFixture(), resultFixture())
  assert.deepEqual(payload.contact, {
    naam: 'Jan Jansen',
    bedrijfsnaam: 'Jansen & Zn. B.V.',
    email: 'jan@bedrijf.test',
    telefoon: '0612345678',
  })
})

test('buildInterneJsonPayload: bevat alle ingevulde invoerwaarden van de Energie Indicatie', () => {
  const payload = buildInterneJsonPayload(valuesFixture({ gasverbruik: '1800', elekverbruik: '12000', energiekosten: '950' }), resultFixture())
  assert.equal(payload.invoer.pandtype, 'kantoor')
  assert.equal(payload.invoer.oppervlakte, '500')
  assert.equal(payload.invoer.verwarming, 'hr_ketel')
  assert.equal(payload.invoer.gasverbruik, '1800')
  assert.equal(payload.invoer.elekverbruik, '12000')
  assert.equal(payload.invoer.energiekosten, '950')
})

test('buildInterneJsonPayload: bevat het volledige berekende resultaat, inclusief maatregelen met bedragen', () => {
  const result = resultFixture()
  const payload = buildInterneJsonPayload(valuesFixture(), result)
  assert.deepEqual(payload.resultaat, result)
  assert.equal(payload.resultaat.maatregelen[0].besparingEuro, 2600)
  assert.equal(payload.resultaat.huidigeKosten, 27615)
})

test('buildInterneJsonPayload: is valide JSON (round-trip zonder verlies)', () => {
  const payload = buildInterneJsonPayload(valuesFixture(), resultFixture())
  const json = JSON.stringify(payload)
  const herladen = JSON.parse(json)
  assert.deepEqual(herladen, payload)
})

test('buildInterneJsonBestandsnaam: bevat bedrijfsnaam (veilig gemaakt) en een datum, eindigt op .json', () => {
  const naam = buildInterneJsonBestandsnaam(valuesFixture(), new Date('2026-10-06T12:00:00Z'))
  assert.equal(naam, 'energie-indicatie-jansen-zn-b-v-2026-10-06.json')
})

test('buildInterneJsonBestandsnaam: valt terug op de persoonsnaam als er geen bedrijfsnaam is ingevuld', () => {
  const naam = buildInterneJsonBestandsnaam(valuesFixture({ bedrijfsnaam: '' }), new Date('2026-10-06T12:00:00Z'))
  assert.equal(naam, 'energie-indicatie-jan-jansen-2026-10-06.json')
})

test('buildInterneJsonBestandsnaam: valt nooit leeg/onveilig uit, ook niet met alleen speciale tekens', () => {
  const naam = buildInterneJsonBestandsnaam(valuesFixture({ bedrijfsnaam: '/../\\*?"<>|', naam: '' }), new Date('2026-10-06T12:00:00Z'))
  assert.equal(naam, 'energie-indicatie-onbekend-2026-10-06.json')
  assert.equal(/[/\\*?"<>|]/.test(naam), false)
})
