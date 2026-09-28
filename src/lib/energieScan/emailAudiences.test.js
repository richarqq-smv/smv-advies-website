import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildInterneLeadParams, buildKlantBevestigingParams } from './emailAudiences.js'

// Lokale fixture die exact de vorm van buildEmailParams()'s output nabootst
// (emailParams.js zelf importeert calculations.js, met de bekende
// extensieloze-import-beperking voor de kale Node-testrunner — zie
// emailAudiences.js's eigen bestandscomment). Bevat bewust dezelfde
// "gevaarlijke" velden (bedragen, volledige maatregelentekst) als de echte
// output, zodat deze tests daadwerkelijk aantonen dat de klantmail-functie
// ze verwijdert/beperkt.
function emailParamsFixture(overrides = {}) {
  return {
    lead_naam: 'Jan Jansen',
    lead_email: 'jan@bedrijf.test',
    lead_telefoon: '0612345678',
    lead_bedrijf: 'Jansen BV',
    pand_type: 'Kantoor',
    bouwjaar: 'Voor 1980',
    oppervlakte: '500 m²',
    verdiepingen: '2',
    beglazing: 'Weet ik niet',
    isolatie_gevel: 'Weet ik niet',
    isolatie_dak: 'Weet ik niet',
    isolatie_vloer: 'Weet ik niet',
    verwarming: 'HR-ketel (gas)',
    gasverbruik: 'Niet opgegeven (geschat)',
    elekverbruik: 'Niet opgegeven (geschat)',
    energiekosten: 'Niet opgegeven',
    status: 'Nog veel potentieel',
    score: 34,
    huidige_kosten: '€ 27.615,00',
    totale_besparing: '€ 16.621,00',
    co2_besparing: '20.272 kg / jaar',
    maatregelen_intern:
      '1. Dakisolatie — besparing ca. € 2.600,00/jaar (2.000 m³ gas/jaar), investering € 8.750,00 - € 13.750,00, terugverdientijd 4,3 jr\n   Isoleer het dak.',
    maatregelen_klant: '1. Dakisolatie\n   Isoleer het dak.',
    ingevuld_op: '27-09-2026, 11:00',
    ...overrides,
  }
}

function resultFixture(overrides = {}) {
  return { huidigeKosten: 27615, totaleBesparing: 16621, co2: 20272, ...overrides }
}

// --- Interne leadmail (SMV Advies zelf) — volledig ---------------------------

test('buildInterneLeadParams: gaat naar het opgegeven zakelijke e-mailadres', () => {
  const params = buildInterneLeadParams(emailParamsFixture(), 'info@smv-advies.nl')
  assert.equal(params.to_email, 'info@smv-advies.nl')
})

test('buildInterneLeadParams: "maatregelen" is de volledige, interne tekst (met bedragen)', () => {
  const params = buildInterneLeadParams(emailParamsFixture(), 'info@smv-advies.nl')
  assert.match(params.maatregelen, /€ 2\.600,00/)
  assert.match(params.maatregelen, /investering/)
  assert.match(params.maatregelen, /terugverdientijd/)
})

test('buildInterneLeadParams: behoudt totale_besparing, co2_besparing en het exacte huidige_kosten-bedrag', () => {
  const params = buildInterneLeadParams(emailParamsFixture(), 'info@smv-advies.nl')
  assert.equal(params.totale_besparing, '€ 16.621,00')
  assert.equal(params.co2_besparing, '20.272 kg / jaar')
  assert.equal(params.huidige_kosten, '€ 27.615,00')
})

// --- Bevestigingsmail aan de klant — beperkt (Fase 6) ------------------------

test('buildKlantBevestigingParams: gaat naar het e-mailadres van de klant zelf, niet naar SMV', () => {
  const params = buildKlantBevestigingParams(emailParamsFixture(), resultFixture(), 'jan@bedrijf.test')
  assert.equal(params.to_email, 'jan@bedrijf.test')
})

test('buildKlantBevestigingParams: "maatregelen" bevat geen investering, besparing of terugverdientijd', () => {
  const params = buildKlantBevestigingParams(emailParamsFixture(), resultFixture(), 'jan@bedrijf.test')
  assert.equal(/€/.test(params.maatregelen), false)
  assert.equal(/investering/i.test(params.maatregelen), false)
  assert.equal(/terugverdientijd/i.test(params.maatregelen), false)
})

test('buildKlantBevestigingParams: totale_besparing en co2_besparing zijn leeg, niet slechts ongebruikt', () => {
  const params = buildKlantBevestigingParams(emailParamsFixture(), resultFixture(), 'jan@bedrijf.test')
  assert.equal(params.totale_besparing, '')
  assert.equal(params.co2_besparing, '')
})

test('buildKlantBevestigingParams: maatregelen_intern is expliciet leeg — verschijnt nooit alsnog via het sjabloon', () => {
  const params = buildKlantBevestigingParams(emailParamsFixture(), resultFixture(), 'jan@bedrijf.test')
  assert.equal(params.maatregelen_intern, '')
})

test('buildKlantBevestigingParams: huidige_kosten is een bandbreedte, geen exact bedrag', () => {
  const params = buildKlantBevestigingParams(emailParamsFixture(), resultFixture(), 'jan@bedrijf.test')
  assert.notEqual(params.huidige_kosten, '€ 27.615,00') // niet meer het exacte interne bedrag
  assert.match(params.huidige_kosten, /^€ [\d.]+ – € [\d.]+ \/ jaar$/)
})

test('buildKlantBevestigingParams: geen enkel veld in de output bevat nog een eurobedrag behalve de kostenbandbreedte zelf', () => {
  const params = buildKlantBevestigingParams(emailParamsFixture(), resultFixture(), 'jan@bedrijf.test')
  const { huidige_kosten, energiekosten, ...rest } = params
  void huidige_kosten
  void energiekosten // eigen ingevoerde maandkosten van de klant, geen berekend resultaat — mag blijven
  for (const [veld, waarde] of Object.entries(rest)) {
    if (typeof waarde === 'string') {
      assert.equal(waarde.includes('€'), false, `veld "${veld}" bevat onverwacht een eurobedrag: "${waarde}"`)
    }
  }
})
