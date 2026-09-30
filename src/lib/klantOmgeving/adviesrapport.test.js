import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bouwAdviesrapportData, bouwSamenvatting, PAKKET_RAPPORT_LABELS } from './adviesrapport.js'

function dossierFixture(overrides = {}) {
  return {
    klanten: { naam: 'Jan Jansen', bedrijfsnaam: 'Jansen BV' },
    contactpersonen: { naam: 'Jan Jansen', email: 'jan@jansenbv.test' },
    panden: { omschrijving: 'Hoofdkantoor', adres: 'Teststraat 1', postcode: '1234 AB', plaats: 'Amersfoort' },
    ...overrides,
  }
}

function adviespuntFixture(overrides = {}) {
  return {
    adviespunt_id: 'a1',
    onderwerp: 'Dakisolatie',
    herkomst: 'handmatig',
    advies_status: 'nu_onderzoeken',
    toelichting: 'Isolatie bekijken',
    investering_laag: 5000,
    investering_hoog: 7000,
    besparing_euro: 800,
    terugverdientijd_jaren: 6.5,
    prioriteit: 1,
    ...overrides,
  }
}

test('bouwAdviesrapportData: klantnaam gaat uit van bedrijfsnaam, pandadres combineert adres/postcode/plaats', () => {
  const data = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten: [adviespuntFixture()], pakketId: 'premium', adviseurNaam: 'Richard' })
  assert.equal(data.meta.klantnaam, 'Jansen BV')
  assert.equal(data.meta.pandadres, 'Teststraat 1, 1234 AB Amersfoort')
  assert.equal(data.meta.pakket, PAKKET_RAPPORT_LABELS.premium)
  assert.equal(data.meta.adviseur, 'Richard')
})

test('bouwAdviesrapportData: klantnaam valt terug op persoonsnaam/contactpersoon als bedrijfsnaam ontbreekt', () => {
  const dossier = dossierFixture({ klanten: { naam: 'Piet Pietersen', bedrijfsnaam: null } })
  const data = bouwAdviesrapportData({ dossier, adviespunten: [], pakketId: 'basis' })
  assert.equal(data.meta.klantnaam, 'Piet Pietersen')
})

test('bouwAdviesrapportData: maatregelen worden gesorteerd op prioriteit, dan op terugverdientijd', () => {
  const adviespunten = [
    adviespuntFixture({ adviespunt_id: 'a1', onderwerp: 'Ledverlichting', prioriteit: 2, terugverdientijd_jaren: 3 }),
    adviespuntFixture({ adviespunt_id: 'a2', onderwerp: 'Dakisolatie', prioriteit: 1, terugverdientijd_jaren: 8 }),
    adviespuntFixture({ adviespunt_id: 'a3', onderwerp: 'Zonnepanelen', prioriteit: 1, terugverdientijd_jaren: 5 }),
  ]
  const data = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten, pakketId: 'gold' })
  assert.deepEqual(
    data.maatregelen.map((m) => m.onderwerp),
    ['Zonnepanelen', 'Dakisolatie', 'Ledverlichting'],
  )
  assert.equal(data.maatregelen[0].nummer, 1)
  assert.equal(data.maatregelen[2].nummer, 3)
})

test('bouwAdviesrapportData: adviespunten zonder prioriteit komen achteraan, nooit een crash', () => {
  const adviespunten = [
    adviespuntFixture({ adviespunt_id: 'a1', onderwerp: 'Zonder prioriteit', prioriteit: null, terugverdientijd_jaren: null }),
    adviespuntFixture({ adviespunt_id: 'a2', onderwerp: 'Met prioriteit', prioriteit: 1 }),
  ]
  const data = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten, pakketId: 'basis' })
  assert.deepEqual(
    data.maatregelen.map((m) => m.onderwerp),
    ['Met prioriteit', 'Zonder prioriteit'],
  )
})

test('bouwAdviesrapportData: investeringsbandbreedte wordt alleen als bereik getoond als laag/hoog verschillen', () => {
  const gelijk = bouwAdviesrapportData({
    dossier: dossierFixture(),
    adviespunten: [adviespuntFixture({ investering_laag: 5000, investering_hoog: 5000 })],
    pakketId: 'basis',
  })
  assert.equal(gelijk.maatregelen[0].investering, '€ 5.000')

  const bereik = bouwAdviesrapportData({
    dossier: dossierFixture(),
    adviespunten: [adviespuntFixture({ investering_laag: 5000, investering_hoog: 7000 })],
    pakketId: 'basis',
  })
  assert.equal(bereik.maatregelen[0].investering, '€ 5.000 – € 7.000')
})

test('bouwAdviesrapportData: ontbrekende financiële velden worden expliciet gemarkeerd, nooit verzonnen', () => {
  const adviespunten = [adviespuntFixture({ investering_laag: null, investering_hoog: null, besparing_euro: null, terugverdientijd_jaren: null, prioriteit: null })]
  const data = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten, pakketId: 'basis' })
  assert.equal(data.maatregelen[0].investering, null)
  assert.equal(data.maatregelen[0].besparing, null)
  assert.ok(data.ontbrekendeVelden.includes('maatregel 1: investering'))
  assert.ok(data.ontbrekendeVelden.includes('maatregel 1: besparing'))
  assert.ok(data.ontbrekendeVelden.includes('maatregel 1: terugverdientijd'))
  assert.ok(data.ontbrekendeVelden.includes('maatregel 1: prioriteit'))
})

test('bouwAdviesrapportData: lege adviespunten-lijst levert lege maatregelenlijst en gemarkeerde ontbrekende data, geen crash', () => {
  const data = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten: [], pakketId: 'gold' })
  assert.deepEqual(data.maatregelen, [])
  assert.ok(data.ontbrekendeVelden.includes('adviespunten'))
  assert.equal(data.samenvatting[0], 'Voor dit dossier is nog geen definitief advies vastgelegd.')
})

test('bouwAdviesrapportData: ontbrekende klant/pand/adviseur-gegevens worden gemarkeerd', () => {
  const dossier = { klanten: null, contactpersonen: null, panden: null }
  const data = bouwAdviesrapportData({ dossier, adviespunten: [], pakketId: 'basis' })
  assert.equal(data.meta.klantnaam, null)
  assert.equal(data.meta.pandadres, null)
  assert.ok(data.ontbrekendeVelden.includes('klantnaam'))
  assert.ok(data.ontbrekendeVelden.includes('pandadres'))
  assert.ok(data.ontbrekendeVelden.includes('adviseur'))
})

test('bouwAdviesrapportData: onbekend pakketId levert geen pakketlabel (geen verzonnen tekst)', () => {
  const data = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten: [], pakketId: 'onbekend' })
  assert.equal(data.meta.pakket, null)
})

test('bouwAdviesrapportData: datum valt terug op vandaag als geen datum is opgegeven, geeft geldig NL-formaat', () => {
  const data = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten: [], pakketId: 'basis' })
  assert.match(data.meta.datumRapport, /^\d{2}-\d{2}-\d{4}$/)
})

test('bouwSamenvatting: groepeert per status met voorzichtige formulering, sluit af met disclaimer', () => {
  const adviespunten = [
    adviespuntFixture({ onderwerp: 'Dakisolatie', advies_status: 'nu_onderzoeken' }),
    adviespuntFixture({ onderwerp: 'Ventilatie', advies_status: 'geen_actie_nodig' }),
  ]
  const paragrafen = bouwSamenvatting(adviespunten)
  assert.ok(paragrafen.some((p) => p.includes('dakisolatie')))
  assert.ok(paragrafen.some((p) => p.includes('ventilatie')))
  assert.equal(paragrafen.at(-1), 'Dit overzicht ondersteunt de beoordeling van de adviseur en vervangt geen technische inspectie.')
})

test('bouwSamenvatting: lege lijst geeft duidelijke melding, geen crash', () => {
  assert.deepEqual(bouwSamenvatting([]), ['Voor dit dossier is nog geen definitief advies vastgelegd.'])
  assert.deepEqual(bouwSamenvatting(null), ['Voor dit dossier is nog geen definitief advies vastgelegd.'])
})

test('bouwAdviesrapportData: bouwkundige analyse vult de 4 vaste rijen uit dossier.bouwkundige_analyse', () => {
  const dossier = dossierFixture({
    bouwkundige_analyse: {
      gevel: { waarde: '0,35', eenheid: 'Rc', beoordeling: 'Onvoldoende', opmerking: 'Spouw ongeïsoleerd' },
      dak: { waarde: '2,5', eenheid: 'Rc', beoordeling: 'Voldoet', opmerking: '' },
    },
  })
  const data = bouwAdviesrapportData({ dossier, adviespunten: [], pakketId: 'premium' })
  assert.equal(data.bouwkundigeAnalyse.length, 4)
  assert.equal(data.bouwkundigeAnalyse[0].label, 'Gevel (spouwmuur)')
  assert.equal(data.bouwkundigeAnalyse[0].waarde, '0,35 Rc')
  assert.equal(data.bouwkundigeAnalyse[0].beoordeling, 'Onvoldoende')
  assert.equal(data.bouwkundigeAnalyse[2].waarde, null)
})

test('bouwAdviesrapportData: ontbrekende bouwkundige analyse wordt alleen gemarkeerd bij premium/gold', () => {
  const dossier = dossierFixture()
  const basis = bouwAdviesrapportData({ dossier, adviespunten: [], pakketId: 'basis' })
  assert.ok(!basis.ontbrekendeVelden.includes('bouwkundige analyse (Rc/U-waarden)'))

  const premium = bouwAdviesrapportData({ dossier, adviespunten: [], pakketId: 'premium' })
  assert.ok(premium.ontbrekendeVelden.includes('bouwkundige analyse (Rc/U-waarden)'))
})

test('bouwAdviesrapportData: subsidiestappen worden gesorteerd op volgorde en gedateerd geformatteerd', () => {
  const subsidieTaken = [
    { omschrijving: 'ISDE-aanvraag', verantwoordelijke: 'SMV Advies', volgorde: 1, deadline: '2026-06-01' },
    { omschrijving: 'EIA-melding', verantwoordelijke: 'SMV Advies', volgorde: 0, deadline: null },
  ]
  const data = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten: [], pakketId: 'gold', subsidieTaken })
  assert.equal(data.subsidieStappen.length, 2)
  assert.equal(data.subsidieStappen[0].actie, 'EIA-melding')
  assert.equal(data.subsidieStappen[0].deadline, null)
  assert.equal(data.subsidieStappen[1].actie, 'ISDE-aanvraag')
  assert.equal(data.subsidieStappen[1].deadline, '01-06-2026')
})

test('bouwAdviesrapportData: lege subsidiestappen worden alleen bij gold gemarkeerd als ontbrekend', () => {
  const premium = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten: [], pakketId: 'premium' })
  assert.ok(!premium.ontbrekendeVelden.includes('subsidiebegeleidingsplan'))

  const gold = bouwAdviesrapportData({ dossier: dossierFixture(), adviespunten: [], pakketId: 'gold' })
  assert.ok(gold.ontbrekendeVelden.includes('subsidiebegeleidingsplan'))
})
